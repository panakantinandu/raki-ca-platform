package com.caagent.repository;

import com.caagent.model.ContactSubmission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ContactSubmissionRepository extends JpaRepository<ContactSubmission, UUID> {
    Page<ContactSubmission> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
