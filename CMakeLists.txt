cmake_minimum_required(VERSION 3.10)
project(PharmacyInventory)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Add executable
add_executable(PharmacyInventory
    src/main.cpp
    src/Medication.cpp
    src/Inventory.cpp
    src/DatabaseManager.cpp
    include/sqlite3.c
)

# Include directories
target_include_directories(PharmacyInventory PRIVATE include)

# Link libraries (needed for SQLite on Windows)
if(WIN32)
    target_link_libraries(PharmacyInventory PRIVATE -static-libgcc -static-libstdc++)
endif()