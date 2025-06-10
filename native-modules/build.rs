use std::env;

fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    
    // 빌드 환경 설정
    if cfg!(target_os = "windows") {
        println!("cargo:rustc-link-lib=user32");
        println!("cargo:rustc-link-lib=kernel32");
    }
    
    // 환경 변수 기반 최적화
    if env::var("PROFILE").unwrap_or_default() == "release" {
        println!("cargo:rustc-link-arg=-s");  // Strip symbols
    }
    
    // NAPI 빌드 설정
    napi_build::setup();
}
