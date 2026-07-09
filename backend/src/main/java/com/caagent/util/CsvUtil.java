package com.caagent.util;

/**
 * Minimal CSV row builder - good enough for straightforward export data (no embedded binary
 * content). Quotes a field and doubles any internal quotes whenever it contains a comma,
 * quote, or newline, per the standard CSV escaping convention.
 */
public final class CsvUtil {

    private CsvUtil() {}

    public static String row(Object... values) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(escape(values[i]));
        }
        sb.append("\r\n");
        return sb.toString();
    }

    private static String escape(Object value) {
        String s = value == null ? "" : value.toString();
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
