from PIL import Image, ImageDraw

def round_corners(image, radius):
    """Adds rounded corners to an image."""
    circle = Image.new('L', (radius * 2, radius * 2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, radius * 2, radius * 2), fill=255)

    alpha = Image.new('L', image.size, 255)
    w, h = image.size

    alpha.paste(circle.crop((0, 0, radius, radius)), (0, 0))
    alpha.paste(circle.crop((0, radius, radius, radius * 2)), (0, h - radius))
    alpha.paste(circle.crop((radius, 0, radius * 2, radius)), (w - radius, 0))
    alpha.paste(circle.crop((radius, radius, radius * 2, radius * 2)), (w - radius, h - radius))

    image.putalpha(alpha)
    return image

try:
    img = Image.open('sprite/app/icon.png').convert("RGBA")
    
    # Calculate radius (e.g. 20% of width)
    radius = int(min(img.size) * 0.2)
    
    rounded_img = round_corners(img, radius)
    
    # Save 192x192
    img_192 = rounded_img.resize((192, 192), Image.Resampling.LANCZOS)
    img_192.save('icon-192.png')
    
    # Save 512x512
    img_512 = rounded_img.resize((512, 512), Image.Resampling.LANCZOS)
    img_512.save('icon-512.png')
    print("Icons generated successfully.")
except Exception as e:
    print(f"Error: {e}")
