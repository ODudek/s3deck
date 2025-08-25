mod commands;
mod config;
mod content_type;
mod models;
mod s3_client;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Config management
            get_buckets,
            add_bucket,
            update_bucket,
            delete_bucket_config,
            get_bucket,
            // S3 operations
            list_objects,
            delete_object,
            get_object_metadata,
            upload_files,
            count_files,
            rename_object,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
