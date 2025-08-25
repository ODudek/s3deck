use mime_guess::from_path;
use std::path::Path;

/// Determines the MIME type based on file extension using mime_guess library
pub fn get_content_type_from_extension(file_path: &str) -> String {
    let path = Path::new(file_path);

    // Use mime_guess to get the MIME type
    let mime_type = from_path(path).first_or_octet_stream();
    let mut content_type = mime_type.to_string();

    let lowercase_path = file_path.to_lowercase();

    if lowercase_path.ends_with(".map") || lowercase_path.ends_with(".js.map") {
        content_type = "application/json".to_string();
    } else if content_type == "application/octet-stream" {
        // If mime_guess couldn't determine the type, keep it as octet-stream
        content_type = "application/octet-stream".to_string();
    }

    content_type
}

/// Validates if the new filename has a valid format
pub fn validate_filename(filename: &str) -> bool {
    if filename.is_empty() {
        return false;
    }

    // Check for invalid characters on different platforms
    let invalid_chars = ['<', '>', ':', '"', '|', '?', '*', '\0'];
    if filename.chars().any(|c| invalid_chars.contains(&c)) {
        return false;
    }

    // Check for reserved names on Windows
    let reserved_names = [
        "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8",
        "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
    ];

    let name_without_ext = filename.split('.').next().unwrap_or("").to_uppercase();
    if reserved_names.contains(&name_without_ext.as_str()) {
        return false;
    }

    // Don't allow names that start or end with spaces or dots
    if filename.starts_with(' ') || filename.ends_with(' ') || filename.starts_with('.') {
        return false;
    }

    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_content_type_detection() {
        // Test common file types
        assert_eq!(get_content_type_from_extension("file.jpg"), "image/jpeg");
        assert_eq!(get_content_type_from_extension("file.png"), "image/png");
        assert_eq!(
            get_content_type_from_extension("file.pdf"),
            "application/pdf"
        );
        assert_eq!(get_content_type_from_extension("file.txt"), "text/plain");
        assert_eq!(
            get_content_type_from_extension("file.json"),
            "application/json"
        );
        assert_eq!(get_content_type_from_extension("file.html"), "text/html");
        assert_eq!(get_content_type_from_extension("file.css"), "text/css");
        assert_eq!(
            get_content_type_from_extension("file.js"),
            "text/javascript"
        );

        // Test special cases
        assert_eq!(
            get_content_type_from_extension("file.js.map"),
            "application/json"
        );
        assert_eq!(
            get_content_type_from_extension("style.css.map"),
            "application/json"
        );
        // These will use mime_guess defaults
        assert_eq!(
            get_content_type_from_extension("component.ts"),
            "video/vnd.dlna.mpeg-tts"
        );
        assert_eq!(
            get_content_type_from_extension("readme.md"),
            "text/markdown"
        );

        // Test unknown extensions
        assert_eq!(
            get_content_type_from_extension("file.unknown"),
            "application/octet-stream"
        );
        assert_eq!(
            get_content_type_from_extension("file"),
            "application/octet-stream"
        );
    }

    #[test]
    fn test_filename_validation() {
        // Valid filenames
        assert!(validate_filename("valid_file.txt"));
        assert!(validate_filename("file-name.pdf"));
        assert!(validate_filename("file123.jpg"));
        assert!(validate_filename("myfile.tar.gz"));
        assert!(validate_filename("component.tsx"));

        // Invalid filenames
        assert!(!validate_filename(""));
        assert!(!validate_filename("file<name.txt"));
        assert!(!validate_filename("file>name.txt"));
        assert!(!validate_filename("file:name.txt"));
        assert!(!validate_filename("file\"name.txt"));
        assert!(!validate_filename("file|name.txt"));
        assert!(!validate_filename("file?name.txt"));
        assert!(!validate_filename("file*name.txt"));

        // Reserved names
        assert!(!validate_filename("CON.txt"));
        assert!(!validate_filename("PRN.jpg"));
        assert!(!validate_filename("AUX.pdf"));
        assert!(!validate_filename("NUL.doc"));
        assert!(!validate_filename("COM1.exe"));
        assert!(!validate_filename("LPT1.dat"));

        // Names starting/ending with spaces or dots
        assert!(!validate_filename(" filename.txt"));
        assert!(!validate_filename("filename.txt "));
        assert!(!validate_filename(".hidden"));

        // Case insensitive reserved names
        assert!(!validate_filename("con.txt"));
        assert!(!validate_filename("Con.TXT"));
    }

    #[test]
    fn test_case_sensitivity() {
        // Test that extensions are handled case-insensitively
        assert_eq!(get_content_type_from_extension("FILE.JPG"), "image/jpeg");
        assert_eq!(
            get_content_type_from_extension("File.PDF"),
            "application/pdf"
        );
        assert_eq!(get_content_type_from_extension("STYLE.CSS"), "text/css");
    }

    #[test]
    fn test_mime_guess_vs_special_cases() {
        use mime_guess::from_path;

        // Test that our special cases override mime_guess when appropriate
        let standard_js = from_path("script.js").first_or_octet_stream().to_string();
        let our_js = get_content_type_from_extension("script.js");
        println!("Standard JS: {}, Our JS: {}", standard_js, our_js);

        // Test source map files (our special case)
        let standard_map = from_path("app.js.map").first_or_octet_stream().to_string();
        let our_map = get_content_type_from_extension("app.js.map");
        println!("Standard MAP: {}, Our MAP: {}", standard_map, our_map);
        assert_eq!(our_map, "application/json");

        // Test TypeScript files (now uses mime_guess default)
        let standard_ts = from_path("component.ts")
            .first_or_octet_stream()
            .to_string();
        let our_ts = get_content_type_from_extension("component.ts");
        println!("Standard TS: {}, Our TS: {}", standard_ts, our_ts);
        assert_eq!(our_ts, standard_ts); // Should be the same now

        // Test that we fall back to mime_guess for regular files
        let standard_png = from_path("image.png").first_or_octet_stream().to_string();
        let our_png = get_content_type_from_extension("image.png");
        assert_eq!(standard_png, our_png);

        // Test that other files use mime_guess defaults
        let standard_yaml = from_path("config.yaml").first_or_octet_stream().to_string();
        let our_yaml = get_content_type_from_extension("config.yaml");
        assert_eq!(our_yaml, standard_yaml);
    }
}
