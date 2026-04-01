#include <iostream>
#include <cstdlib>
#include <string>
#include <fstream>
#include <filesystem>

#ifdef _WIN32
#include <windows.h>
#include <shellapi.h>
#elif __linux__
#include <unistd.h>
#include <sys/wait.h>
#elif __APPLE__
#include <unistd.h>
#include <cstdlib>
#endif

// Function to get the directory where the executable is located
std::string getExecutableDirectory() {
    std::string exePath;
    
#ifdef _WIN32
    char buffer[MAX_PATH];
    GetModuleFileNameA(NULL, buffer, MAX_PATH);
    exePath = std::string(buffer);
    // Remove the executable name
    size_t lastSlash = exePath.find_last_of("\\/");
    if (lastSlash != std::string::npos) {
        exePath = exePath.substr(0, lastSlash);
    }
#elif __linux__
    char buffer[PATH_MAX];
    ssize_t len = readlink("/proc/self/exe", buffer, sizeof(buffer)-1);
    if (len != -1) {
        buffer[len] = '\0';
        exePath = std::string(buffer);
        size_t lastSlash = exePath.find_last_of('/');
        if (lastSlash != std::string::npos) {
            exePath = exePath.substr(0, lastSlash);
        }
    }
#elif __APPLE__
    char buffer[PATH_MAX];
    uint32_t size = sizeof(buffer);
    if (_NSGetExecutablePath(buffer, &size) == 0) {
        exePath = std::string(buffer);
        size_t lastSlash = exePath.find_last_of('/');
        if (lastSlash != std::string::npos) {
            exePath = exePath.substr(0, lastSlash);
        }
    }
#endif
    
    return exePath;
}

// Function to get the HTML file path
std::string getHtmlPath() {
    std::string exeDir = getExecutableDirectory();
    if (exeDir.empty()) {
        // Fallback to current directory
        return "tournament_manager.html";
    }
    return exeDir + "/tournament_manager.html";
}

// Function to check if the HTML file exists
bool htmlFileExists(const std::string& filePath) {
    std::ifstream file(filePath);
    return file.good();
}

// Function to open the HTML file in default browser
void openInBrowser(const std::string& filePath) {
    std::cout << "Opening MLBB Tournament Manager in your default browser..." << std::endl;
    std::cout << "File location: " << filePath << std::endl;
    
#ifdef _WIN32
    // Windows: Use ShellExecute
    ShellExecuteA(NULL, "open", filePath.c_str(), NULL, NULL, SW_SHOWNORMAL);
#elif __APPLE__
    // macOS: Use open command
    std::string command = "open \"" + filePath + "\"";
    system(command.c_str());
#else
    // Linux/Unix: Try xdg-open, then various browsers
    std::string command = "xdg-open \"" + filePath + "\" 2>/dev/null";
    int result = system(command.c_str());
    if (result != 0) {
        // Fallback to common browsers
        command = "firefox \"" + filePath + "\" 2>/dev/null || "
                  "google-chrome \"" + filePath + "\" 2>/dev/null || "
                  "chromium-browser \"" + filePath + "\" 2>/dev/null || "
                  "sensible-browser \"" + filePath + "\"";
        system(command.c_str());
    }
#endif
}

// Function to wait for user input before exiting
void waitForExit() {
    std::cout << "\n========================================" << std::endl;
    std::cout << "MLBB Tournament Manager is running in your browser." << std::endl;
    std::cout << "Press Enter to close this console and exit..." << std::endl;
    std::cout << "(The browser window will remain open.)" << std::endl;
    std::cin.get();
}

int main() {
    // Set console title
#ifdef _WIN32
    SetConsoleTitleA("MLBB Tournament Manager Launcher");
#endif
    
    // Display welcome message
    std::cout << "========================================" << std::endl;
    std::cout << "   MLBB TOURNAMENT MANAGER LAUNCHER   " << std::endl;
    std::cout << "========================================" << std::endl;
    std::cout << std::endl;
    
    // Get the HTML file path
    std::string htmlPath = getHtmlPath();
    
    // Check if HTML file exists
    std::cout << "Looking for tournament_manager.html..." << std::endl;
    if (!htmlFileExists(htmlPath)) {
        std::cerr << "Error: tournament_manager.html not found!" << std::endl;
        std::cerr << "Please make sure the HTML file is in the same directory as this executable." << std::endl;
        std::cerr << "Expected location: " << htmlPath << std::endl;
        std::cout << "\nPress Enter to exit..." << std::endl;
        std::cin.get();
        return 1;
    }
    
    std::cout << "HTML file found successfully!" << std::endl;
    std::cout << std::endl;
    
    // Open in default browser
    openInBrowser(htmlPath);
    
    // Wait for user to close the console
    waitForExit();
    
    std::cout << "Exiting MLBB Tournament Manager Launcher." << std::endl;
    
    return 0;
}