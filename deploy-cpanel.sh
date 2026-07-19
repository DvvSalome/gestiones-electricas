#!/bin/bash
set -e

echo "1. Creating temporary PHP scripts..."
cat << 'EOF' > extract.php
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$zipFile = 'gestiones-electricas-optimized.zip';
$extractPath = './';

$zip = new ZipArchive;
if ($zip->open($zipFile) === TRUE) {
    $zip->extractTo($extractPath);
    $zip->close();
    echo json_encode([
        'status' => 'success',
        'message' => 'Extraction completed successfully!'
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to open zip file: ' . $zipFile
    ]);
}
?>
EOF

cat << 'EOF' > cleanup.php
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$files = [
    'gestiones-electricas-optimized.zip',
    'extract.php',
    'cleanup.php'
];

$results = [];
foreach ($files as $file) {
    if (file_exists($file)) {
        if (unlink($file)) {
            $results[$file] = 'deleted';
        } else {
            $results[$file] = 'failed to delete';
        }
    } else {
        $results[$file] = 'not found';
    }
}

echo json_encode([
    'status' => 'success',
    'results' => $results
]);
?>
EOF

echo "2. Minifying assets in place..."
# Backup original files
cp js/app.js js/app.bak.js
cp js/scene.js js/scene.bak.js
cp js/blog.js js/blog.bak.js
cp js/i18n.js js/i18n.bak.js
cp js/sound.js js/sound.bak.js
cp css/styles.css css/styles.bak.css

# Run minifiers
npx -y terser js/app.js -c -m -o js/app.js
npx -y terser js/scene.js -c -m -o js/scene.js
npx -y terser js/blog.js -c -m -o js/blog.js
npx -y terser js/i18n.js -c -m -o js/i18n.js
npx -y terser js/sound.js -c -m -o js/sound.js
npx -y clean-css-cli css/styles.css -o css/styles.css

echo "3. Compressing project..."
zip -r ../gestiones-electricas-optimized.zip . \
  -x "*.git*" \
  -x "*lighthouse-report*" \
  -x "*backup-*.tar.gz" \
  -x "*dev-old-site*" \
  -x "deploy-cpanel.sh" \
  -x "extract.php" \
  -x "cleanup.php" \
  -x "scratch/*" \
  -x ".agents/*" \
  -x "*.agents*" \
  -x "*.DS_Store" \
  -x "*.bak.*" \
  -x "optimize_images.py"

echo "Restoring original assets..."
mv js/app.bak.js js/app.js
mv js/scene.bak.js js/scene.js
mv js/blog.bak.js js/blog.js
mv js/i18n.bak.js js/i18n.js
mv js/sound.bak.js js/sound.js
mv css/styles.bak.css css/styles.css

echo "4. Uploading ZIP to cPanel..."
curl -H "Authorization: cpanel gestioneselectri:${CPANEL_TOKEN:?exportar CPANEL_TOKEN}" \
  -F "dir=/home/gestioneselectri/public_html" \
  -F "overwrite=1" \
  -F "file-1=@../gestiones-electricas-optimized.zip" \
  "https://gestioneselectricas.com:2083/execute/Fileman/upload_files"

echo "5. Uploading extract.php..."
curl -H "Authorization: cpanel gestioneselectri:${CPANEL_TOKEN:?exportar CPANEL_TOKEN}" \
  -F "dir=/home/gestioneselectri/public_html" \
  -F "overwrite=1" \
  -F "file-1=@extract.php" \
  "https://gestioneselectricas.com:2083/execute/Fileman/upload_files"

echo "6. Uploading cleanup.php..."
curl -H "Authorization: cpanel gestioneselectri:${CPANEL_TOKEN:?exportar CPANEL_TOKEN}" \
  -F "dir=/home/gestioneselectri/public_html" \
  -F "overwrite=1" \
  -F "file-1=@cleanup.php" \
  "https://gestioneselectricas.com:2083/execute/Fileman/upload_files"

echo "7. Triggering extraction on remote server..."
curl -i "https://gestioneselectricas.com/extract.php"

echo "8. Triggering cleanup on remote server..."
curl -i "https://gestioneselectricas.com/cleanup.php"

echo "9. Cleaning up local temporary files..."
rm -f extract.php cleanup.php ../gestiones-electricas-optimized.zip

echo "Deployment finished successfully!"
