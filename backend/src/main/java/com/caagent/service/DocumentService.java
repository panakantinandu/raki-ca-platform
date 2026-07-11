package com.caagent.service;

import com.caagent.exception.ApiException;
import com.caagent.model.Client;
import com.caagent.model.Document;
import com.caagent.model.User;
import com.caagent.repository.ClientRepository;
import com.caagent.repository.DocumentRepository;
import com.caagent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    // Allow-list, not a deny-list: only these content types are accepted.
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf", "image/png", "image/jpeg",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel", "text/csv"
    );
    private static final long MAX_SIZE_BYTES = 15L * 1024 * 1024; // 15MB, matches multipart config

    private final DocumentRepository documentRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    @Value("${app.storage.local-dir:/tmp/caagent-uploads}")
    private String localStorageDir;

    public Page<Document> listDocuments(UUID ownerId, UUID clientId, Pageable pageable) {
        if (clientId != null) {
            return documentRepository.findByOwnerIdAndClientId(ownerId, clientId, pageable);
        }
        return documentRepository.findByOwnerId(ownerId, pageable);
    }

    /**
     * Deletes the DB row first, then best-effort removes the file from disk. Order matters:
     * if the disk delete failed first and the DB delete then also failed, we'd be left with an
     * orphaned file with no record - annoying but harmless. The reverse (DB row gone, file
     * still on disk) just wastes a little disk space, which is the safer failure mode.
     */
    @Transactional
    public void deleteDocument(UUID ownerId, UUID documentId) {
        Document document = documentRepository.findByIdAndOwnerId(documentId, ownerId)
                .orElseThrow(() -> ApiException.notFound("Document not found."));

        documentRepository.delete(document);

        try {
            Files.deleteIfExists(Path.of(document.getStorageKey()));
        } catch (IOException e) {
            log.warn("Deleted document {} from DB but failed to remove file at {}", documentId, document.getStorageKey(), e);
        }
    }

    @Transactional
    public Document upload(UUID ownerId, UUID clientId, MultipartFile file) {
        if (file.isEmpty()) {
            throw ApiException.badRequest("The uploaded file is empty.");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw ApiException.badRequest("File exceeds the 15MB upload limit.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw ApiException.badRequest("Unsupported file type. Allowed: PDF, PNG, JPEG, CSV, XLS/XLSX.");
        }

        // Never trust the client-supplied filename for the path on disk -
        // generate our own name and keep the original only as metadata.
        String safeOriginalName = sanitizeFileName(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + "-" + safeOriginalName;

        try {
            // The declared Content-Type is just a header the client wrote - verify the
            // actual bytes match, so a renamed .exe with a spoofed "application/pdf"
            // header can't slip past the allow-list above.
            byte[] fileBytes = file.getBytes();
            if (!matchesDeclaredType(contentType, fileBytes)) {
                throw ApiException.badRequest("File content doesn't match its declared type.");
            }

            Path dir = Path.of(localStorageDir);
            Files.createDirectories(dir);
            Path target = dir.resolve(storedName).normalize();

            // Defense against path traversal: resolved path must still live inside the storage dir.
            if (!target.startsWith(dir)) {
                throw ApiException.badRequest("Invalid file name.");
            }

            Files.write(target, fileBytes);

            User owner = userRepository.getReferenceById(ownerId);
            Client client = clientId != null ? clientRepository.findByIdAndOwnerId(clientId, ownerId)
                    .orElseThrow(() -> ApiException.notFound("Client not found.")) : null;

            Document document = Document.builder()
                    .id(UUID.randomUUID())
                    .owner(owner)
                    .client(client)
                    .fileName(safeOriginalName)
                    .contentType(contentType)
                    .sizeBytes(file.getSize())
                    .storageKey(target.toString())
                    .build();

            return documentRepository.save(document);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store uploaded file", e);
        }
    }

    private String sanitizeFileName(String name) {
        if (name == null) return "upload";
        // Strip any path separators and anything that isn't a safe filename character.
        String base = Path.of(name).getFileName().toString();
        return base.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    /** Verifies the file's actual magic bytes match the declared Content-Type header. */
    private boolean matchesDeclaredType(String contentType, byte[] bytes) {
        return switch (contentType) {
            case "application/pdf" -> startsWith(bytes, 0x25, 0x50, 0x44, 0x46); // %PDF
            case "image/png" -> startsWith(bytes, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
            case "image/jpeg" -> startsWith(bytes, 0xFF, 0xD8, 0xFF);
            // .xlsx is a zip container; legacy .xls is an OLE compound document.
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> startsWith(bytes, 0x50, 0x4B, 0x03, 0x04);
            case "application/vnd.ms-excel" -> startsWith(bytes, 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1);
            // CSV has no magic number - fall back to "looks like text, not a binary blob".
            case "text/csv" -> looksLikeText(bytes);
            default -> false;
        };
    }

    private boolean startsWith(byte[] bytes, int... expected) {
        if (bytes.length < expected.length) return false;
        for (int i = 0; i < expected.length; i++) {
            if ((bytes[i] & 0xFF) != expected[i]) return false;
        }
        return true;
    }

    private boolean looksLikeText(byte[] bytes) {
        int sampleSize = Math.min(bytes.length, 512);
        for (int i = 0; i < sampleSize; i++) {
            int b = bytes[i] & 0xFF;
            // Allow printable ASCII, tab, CR, LF, and UTF-8 continuation/lead bytes; reject
            // control characters and NUL, which real spreadsheet-export CSVs never contain.
            if (b == 0 || (b < 0x20 && b != '\t' && b != '\r' && b != '\n')) return false;
        }
        return true;
    }
}
