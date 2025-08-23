// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};
use std::thread;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Start Go backend in production
            #[cfg(not(debug_assertions))]
            {
                let app_handle = app.handle();
                let resource_dir = app_handle.path()
                    .resource_dir()
                    .expect("failed to resolve resource dir");
                
                let backend_name = if cfg!(target_os = "windows") {
                    "s3deck-backend.exe"
                } else {
                    "s3deck-backend"
                };
                let backend_path = resource_dir.join("go-backend").join(backend_name);
                
                thread::spawn(move || {
                    let mut cmd = Command::new(&backend_path);
                    cmd.stdout(Stdio::null()).stderr(Stdio::null());
                    
                    if let Err(e) = cmd.spawn() {
                        eprintln!("Failed to start backend: {}", e);
                    }
                });
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
