import os
import re
from PIL import Image

def optimize_images():
    assets_dir = 'assets'
    html_files = ['index.html', 'blog.html']
    
    # Add all files in blog/ and blog/en/
    blog_dir = 'blog'
    if os.path.exists(blog_dir):
        for root, dirs, files in os.walk(blog_dir):
            for file in files:
                if file.endswith('.html'):
                    html_files.append(os.path.join(root, file))
                    
    print(f"Found {len(html_files)} HTML files to update references.")

    # Find all JPG and PNG files in assets/ (skip frames directory and favicon)
    images_to_convert = []
    for file in os.listdir(assets_dir):
        path = os.path.join(assets_dir, file)
        if os.path.isfile(path):
            name, ext = os.path.splitext(file)
            ext = ext.lower()
            if ext in ['.jpg', '.jpeg', '.png'] and name != 'favicon':
                images_to_convert.append((file, name, ext))

    print(f"Found {len(images_to_convert)} images to optimize.")

    replacements = {}
    
    for file, name, ext in images_to_convert:
        src_path = os.path.join(assets_dir, file)
        dest_file = f"{name}.webp"
        dest_path = os.path.join(assets_dir, dest_file)
        
        try:
            with Image.open(src_path) as img:
                orig_w, orig_h = img.size
                
                # Downscale if width > 800px
                if orig_w > 800:
                    new_w = 800
                    new_h = int(orig_h * (800 / orig_w))
                    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                    print(f"Resized {file} from {orig_w}x{orig_h} to {new_w}x{new_h}")
                
                # Save as WebP
                img.save(dest_path, 'WEBP', quality=82)
                print(f"Converted {file} to {dest_file}")
                
                replacements[file] = dest_file
                
                # Delete the original file
                os.remove(src_path)
                print(f"Deleted original {file}")
                
        except Exception as e:
            print(f"Error processing {file}: {e}")

    # Update references in HTML files
    for html_path in html_files:
        if not os.path.exists(html_path):
            continue
            
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        for old_img, new_img in replacements.items():
            # Match references like "assets/solar.jpg"
            content = content.replace(f"assets/{old_img}", f"assets/{new_img}")
            
        if content != original_content:
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated image references in {html_path}")

if __name__ == '__main__':
    optimize_images()
