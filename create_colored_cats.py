import os
import glob
from PIL import Image

def process_images(src_dir, dest_dir_black, dest_dir_white):
    os.makedirs(dest_dir_black, exist_ok=True)
    os.makedirs(dest_dir_white, exist_ok=True)
    
    files = glob.glob(os.path.join(src_dir, "*.png"))
    for f in files:
        try:
            img = Image.open(f).convert("RGBA")
            pixels = img.load()
            w, h = img.size
            
            img_black = Image.new("RGBA", (w, h))
            img_white = Image.new("RGBA", (w, h))
            pixels_b = img_black.load()
            pixels_w = img_white.load()
            
            for y in range(h):
                for x in range(w):
                    r, g, b, a = pixels[x, y]
                    if a > 0:
                        # Convert to grayscale
                        lum = 0.299*r + 0.587*g + 0.114*b
                        
                        # Black cat (dark gray)
                        val_b = int(lum * 0.3)
                        pixels_b[x, y] = (val_b, val_b, val_b, a)
                        
                        # White cat (light gray/white)
                        # We want it bright but not completely flat white to keep shading
                        val_w = min(255, int(lum * 1.3 + 40))
                        pixels_w[x, y] = (val_w, val_w, val_w, a)
                    else:
                        pixels_b[x, y] = (0, 0, 0, 0)
                        pixels_w[x, y] = (0, 0, 0, 0)
                        
            base_name = os.path.basename(f)
            img_black.save(os.path.join(dest_dir_black, base_name), "PNG")
            img_white.save(os.path.join(dest_dir_white, base_name), "PNG")
            print(f"Processed {base_name}")
        except Exception as e:
            print(f"Error processing {f}: {e}")

base_path = r"c:\JOGO-HIP-DOG-RUN-\sprite"

print("Processando gato andando...")
process_images(
    os.path.join(base_path, "gato-andando"),
    os.path.join(base_path, "gato-andando-preto"),
    os.path.join(base_path, "gato-andando-branco")
)

print("Processando gato assustado...")
process_images(
    os.path.join(base_path, "gato-assustado"),
    os.path.join(base_path, "gato-assustado-preto"),
    os.path.join(base_path, "gato-assustado-branco")
)

print("Processamento concluído!")
