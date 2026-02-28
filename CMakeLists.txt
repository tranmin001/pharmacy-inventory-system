cmake_minimum_required(VERSION 3.10)
project(PharmacyInventory)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Add executable
add_executable(PharmacyInventory
    src/main.cpp
    src/Medication.cpp
    src/Inventory.cpp
)

# Include directories
target_include_directories(PharmacyInventory PRIVATE include)