CREATE DATABASE IF NOT EXISTS todo_app
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE todo_app;

CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_key CHAR(48) NULL,
    owner_name VARCHAR(80) NOT NULL DEFAULT 'Pengguna',
    visibility ENUM('personal', 'shared') NOT NULL DEFAULT 'personal',
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    completed TINYINT(1) NOT NULL DEFAULT 0,
    notification_time TIME NULL,
    attachment_path VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tasks_visibility_owner_created (visibility, owner_key, created_at),
    KEY idx_tasks_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO tasks
    (id, owner_key, owner_name, visibility, title, description, completed, notification_time)
VALUES
    (1, NULL, 'Tim Web', 'shared', 'Menyusun jadwal kerja tim',
     'Tentukan prioritas dan pembagian tugas untuk minggu ini.', 0, '09:00:00'),
    (2, NULL, 'Tim Web', 'shared', 'Meninjau hasil desain',
     'Berikan masukan pada rancangan halaman sebelum implementasi.', 0, '13:30:00'),
    (3, NULL, 'Tim Web', 'shared', 'Dokumentasi progres',
     'Catat perkembangan pekerjaan agar semua anggota mendapat informasi.', 1, NULL);
