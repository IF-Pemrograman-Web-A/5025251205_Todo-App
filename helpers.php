<?php
declare(strict_types=1);

function escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function postString(string $key): string
{
    $value = $_POST[$key] ?? '';
    if (!is_string($value)) {
        throw new RuntimeException('Format data yang dikirim tidak valid.');
    }

    return $value;
}

function textLength(string $value): int
{
    $length = preg_match_all('/./us', $value);
    if ($length === false) {
        throw new RuntimeException('Teks yang dikirim harus menggunakan UTF-8 yang valid.');
    }

    return $length;
}

function csrfToken(): string
{
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function setFlash(string $type, string $message): void
{
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function takeFlash(): ?array
{
    $flash = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);

    return $flash;
}

function redirectToView(string $view): never
{
    $destination = $view === 'shared' ? 'shared' : 'personal';
    header('Location: index.php?view=' . $destination, true, 303);
    exit;
}

function storeTaskImage(array $file): ?string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Foto gagal diunggah. Silakan coba lagi.');
    }

    if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
        throw new RuntimeException('Ukuran foto maksimal 5 MB.');
    }

    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        throw new RuntimeException('Berkas yang diunggah tidak valid.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
    ];

    if (!isset($extensions[$mimeType])) {
        throw new RuntimeException('Format foto harus JPG, PNG, GIF, atau WebP.');
    }

    $uploadDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';
    if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0755, true) && !is_dir($uploadDirectory)) {
        throw new RuntimeException('Folder penyimpanan foto tidak dapat dibuat.');
    }

    $fileName = bin2hex(random_bytes(16)) . '.' . $extensions[$mimeType];
    if (!move_uploaded_file($file['tmp_name'], $uploadDirectory . DIRECTORY_SEPARATOR . $fileName)) {
        throw new RuntimeException('Foto tidak dapat disimpan.');
    }

    return 'uploads/' . $fileName;
}

function deleteTaskImage(?string $relativePath): void
{
    if ($relativePath === null || !str_starts_with($relativePath, 'uploads/')) {
        return;
    }

    $fileName = basename($relativePath);
    if ($fileName === '' || $fileName === '.' || $fileName === '..') {
        return;
    }

    $path = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $fileName;
    if (is_file($path) && !unlink($path)) {
        throw new RuntimeException('Foto lama tidak dapat dihapus.');
    }
}
