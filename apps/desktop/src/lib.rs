use tauri::Manager;

#[cfg(mobile)]
mod mobile;

#[cfg(mobile)]
pub use mobile::*;

pub fn run() {
    crate::run();
}