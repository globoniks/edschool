@echo off
REM Batch script to generate PWA icons using ImageMagick
REM Requires ImageMagick to be installed: https://imagemagick.org/

set PUBLIC_DIR=frontend\public
set SOURCE_ICON=%PUBLIC_DIR%\pwa-192x192.png
set TARGET_512=%PUBLIC_DIR%\pwa-512x512.png
set TARGET_180=%PUBLIC_DIR%\apple-touch-icon.png

echo Generating PWA icons...

if not exist "%SOURCE_ICON%" (
    echo Error: Source icon not found: %SOURCE_ICON%
    echo Please create pwa-192x192.png first
    exit /b 1
)

REM Check if ImageMagick is available
where magick >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ImageMagick not found. Please install it from https://imagemagick.org/
    echo Or use the Node.js script: node scripts/generate-pwa-icons.js
    exit /b 1
)

REM Generate 512x512 icon
magick "%SOURCE_ICON%" -resize 512x512 "%TARGET_512%"
if %ERRORLEVEL% EQU 0 (
    echo Created: %TARGET_512%
) else (
    echo Failed to create 512x512 icon
    exit /b 1
)

REM Generate 180x180 apple-touch-icon
magick "%SOURCE_ICON%" -resize 180x180 "%TARGET_180%"
if %ERRORLEVEL% EQU 0 (
    echo Created: %TARGET_180%
) else (
    echo Failed to create apple-touch-icon
    exit /b 1
)

echo.
echo All PWA icons generated successfully!
pause
