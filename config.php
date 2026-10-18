<?php
declare(strict_types=1);

session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_start();

if (!isset($_SESSION['owner_key'])) {
    $_SESSION['owner_key'] = bin2hex(random_bytes(24));
}

if (!isset($_SESSION['user_name'])) {
    $_SESSION['user_name'] = 'Pengguna';
}

$dbHost = getenv('TODO_DB_HOST') ?: '127.0.0.1';
$dbName = getenv('TODO_DB_NAME') ?: 'todo_app';
$dbUser = getenv('TODO_DB_USER') ?: 'root';
$dbPassword = getenv('TODO_DB_PASSWORD') ?: '';

$pdo = new PDO(
    "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
    $dbUser,
    $dbPassword,
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
);
