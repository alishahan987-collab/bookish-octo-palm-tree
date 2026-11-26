"""Turn any picture into a hand-drawn ink + watercolor illustration on cream paper."""
import cv2, numpy as np, sys

CREAM = np.array([236, 244, 248], np.float32)  # BGR of warm cream paper (248,244,236 RGB)

def paper(h, w, seed=0):
    rng = np.random.default_rng(seed)
    low = cv2.resize(rng.normal(0, 1, (h // 40 + 2, w // 40 + 2)).astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC)
    grain = cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 0.8)
    return 1.0 + 0.018 * low + 0.025 * grain

def toonify(src_bgr, out_w=1920, out_h=1080, seed=0, ink=1.0, border=True, crop_wm=True):
    img = src_bgr
    if crop_wm:  # cut off the generator's corner watermark
        h, w = img.shape[:2]
        img = img[: int(h * 0.951), : int(w * 0.951)]
    img = cv2.resize(img, (out_w, out_h), interpolation=cv2.INTER_CUBIC)
    # 1. watercolor-like flattening
    flat = cv2.stylization(img, sigma_s=50, sigma_r=0.35)
    for _ in range(2):
        flat = cv2.bilateralFilter(flat, 9, 40, 9)
    # 2. limited palette (posterize with k-means)
    Z = cv2.resize(flat, (out_w // 4, out_h // 4)).reshape(-1, 3).astype(np.float32)
    _, labels, centers = cv2.kmeans(Z, 14, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0), 2, cv2.KMEANS_PP_CENTERS)
    full = flat.reshape(-1, 3).astype(np.float32)
    # nearest center for full-res pixels (chunked)
    idx = np.empty(full.shape[0], np.int32)
    for s in range(0, full.shape[0], 400000):
        d = ((full[s:s+400000, None, :] - centers[None]) ** 2).sum(-1); idx[s:s+400000] = d.argmin(1)
    poster = centers[idx].reshape(out_h, out_w, 3)
    poster = cv2.GaussianBlur(poster, (0, 0), 1.2)
    col = 0.55 * poster + 0.45 * flat.astype(np.float32)
    # 3. warm, light watercolor wash: lift toward cream, boost saturation a bit
    hsv = cv2.cvtColor(np.clip(col, 0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.25 + 8, 0, 255)
    hsv[..., 2] = np.clip(hsv[..., 2] * 0.92 + 30, 0, 255)
    col = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
    col = col * 0.88 + CREAM * 0.12
    # 4. ink lines (difference of Gaussians)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    gray = cv2.bilateralFilter(gray, 7, 0.1, 7)
    g1 = cv2.GaussianBlur(gray, (0, 0), 1.4); g2 = cv2.GaussianBlur(gray, (0, 0), 2.4)
    dog = g1 - 0.985 * g2
    lines = np.clip((-dog - 0.004) * 60, 0, 1) * ink
    lines = cv2.GaussianBlur(lines, (0, 0), 0.7)
    lines = np.clip(lines * 1.3, 0, 1)[..., None]
    INK = np.array([38, 40, 45], np.float32)
    out = col * (1 - lines * 0.9) + INK * lines * 0.9
    # 5. paper grain
    out = out * paper(out_h, out_w, seed)[..., None]
    # 6. painted area fades into paper with a rough edge
    if border:
        rng = np.random.default_rng(seed + 1)
        m = np.zeros((out_h, out_w), np.float32)
        pad = 34
        cv2.rectangle(m, (pad, pad), (out_w - pad, out_h - pad), 1.0, -1)
        noise = cv2.resize(rng.normal(0, 1, (out_h // 25, out_w // 25)).astype(np.float32), (out_w, out_h), interpolation=cv2.INTER_CUBIC)
        m = cv2.GaussianBlur(m, (0, 0), 10) + noise * 0.12
        m = np.clip((m - 0.5) * 6 + 0.5, 0, 1)[..., None]
        bg = CREAM * paper(out_h, out_w, seed + 2)[..., None]
        out = out * m + bg * (1 - m)
    return np.clip(out, 0, 255).astype(np.uint8)

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    cv2.imwrite(dst, toonify(cv2.imread(src)), [cv2.IMWRITE_JPEG_QUALITY, 93])
