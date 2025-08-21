// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let _ = Command::new("./go-backend/go-s3-browser").spawn();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
