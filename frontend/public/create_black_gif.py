from PIL import Image

# Use original MOT.gif and create black background version
input_file = 'MOT.gif'
output_file = 'MOT-favicon.gif'
target_size = 64  # 64x64 pixels for favicon

# Open the GIF
gif = Image.open(input_file)
frames = []
durations = []

print(f'Processing {input_file}...')

try:
    frame_num = 0
    while True:
        duration = gif.info.get('duration', 100)
        durations.append(duration)
        
        # Convert current frame to RGBA
        current = gif.convert('RGBA')
        pixels = current.load()
        
        # Create new frame with black background
        new_frame = Image.new('RGBA', current.size, (0, 0, 0, 255))
        new_pixels = new_frame.load()
        
        # Process each pixel
        for y in range(current.height):
            for x in range(current.width):
                r, g, b, a = pixels[x, y]
                
                # Calculate brightness
                brightness = (r + g + b) / 3
                
                # If pixel is very light (white/near-white background), make it black
                if brightness > 240 and a > 200:
                    new_pixels[x, y] = (0, 0, 0, 255)
                # If pixel is transparent or semi-transparent, make it black
                elif a < 128:
                    new_pixels[x, y] = (0, 0, 0, 255)
                # If pixel is light gray (anti-aliasing on white), darken it
                elif brightness > 200 and a > 200:
                    new_pixels[x, y] = (0, 0, 0, 255)
                else:
                    # Keep the original color (gold/colored logo parts)
                    new_pixels[x, y] = (r, g, b, 255)
        
        # Resize to favicon size
        resized = new_frame.resize((target_size, target_size), Image.Resampling.LANCZOS)
        frames.append(resized.convert('P', palette=Image.ADAPTIVE, colors=256))
        
        frame_num += 1
        gif.seek(gif.tell() + 1)
except EOFError:
    pass

print(f'Processed {frame_num} frames')

# Save with black background
frames[0].save(output_file, save_all=True, append_images=frames[1:], duration=durations, loop=0, optimize=True)
print(f'Created {output_file} at {target_size}x{target_size}')
