<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    exit('Metode tidak diizinkan.');
}

$view = ($_POST['view'] ?? 'personal') === 'shared' ? 'shared' : 'personal';
$submittedToken = $_POST['csrf_token'] ?? '';
if (!is_string($submittedToken) || !hash_equals(csrfToken(), $submittedToken)) {
    http_response_code(403);
    exit('Permintaan tidak valid. Muat ulang halaman dan coba lagi.');
}

$action = $_POST['action'] ?? '';

try {
    if ($action === 'set_name') {
        $userName = trim(postString('user_name'));
        if ($userName === '' || textLength($userName) > 80) {
            throw new RuntimeException('Nama harus diisi dan maksimal 80 karakter.');
        }

        $_SESSION['user_name'] = $userName;
        setFlash('success', 'Nama pengguna berhasil diperbarui.');
    } elseif ($action === 'create' || $action === 'update') {
        $title = trim(postString('title'));
        $description = trim(postString('description'));
        $notificationTime = trim(postString('notification_time'));

        if ($title === '' || textLength($title) > 160) {
            throw new RuntimeException('Nama tugas wajib diisi (maksimal 160 karakter).');
        }
        if (textLength($description) > 2000) {
            throw new RuntimeException('Deskripsi maksimal 2.000 karakter.');
        }
        if ($notificationTime !== '' && !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $notificationTime)) {
            throw new RuntimeException('Format waktu pengingat tidak valid.');
        }

        $notificationTime = $notificationTime === '' ? null : $notificationTime;
        $newAttachment = storeTaskImage($_FILES['attachment'] ?? []);

        if ($action === 'create') {
            $statement = $pdo->prepare(
                'INSERT INTO tasks (owner_key, owner_name, visibility, title, description, notification_time, attachment_path)
                 VALUES (:owner_key, :owner_name, :visibility, :title, :description, :notification_time, :attachment_path)'
            );
            $statement->execute([
                'owner_key' => $view === 'personal' ? $_SESSION['owner_key'] : null,
                'owner_name' => $_SESSION['user_name'],
                'visibility' => $view,
                'title' => $title,
                'description' => $description,
                'notification_time' => $notificationTime,
                'attachment_path' => $newAttachment,
            ]);
            setFlash('success', $view === 'shared' ? 'Tugas berhasil dibagikan.' : 'Tugas berhasil ditambahkan.');
        } else {
            $taskId = filter_var($_POST['task_id'] ?? null, FILTER_VALIDATE_INT);
            if ($taskId === false || $taskId === null || $taskId < 1) {
                throw new RuntimeException('Tugas yang ingin diperbarui tidak valid.');
            }

            $statement = $pdo->prepare(
                "SELECT id, owner_key, visibility, attachment_path FROM tasks
                 WHERE id = :id
                   AND (visibility = 'shared' OR (visibility = 'personal' AND owner_key = :owner_key))"
            );
            $statement->execute(['id' => $taskId, 'owner_key' => $_SESSION['owner_key']]);
            $existingTask = $statement->fetch();
            if ($existingTask === false) {
                throw new RuntimeException('Tugas tidak ditemukan atau bukan milik sesi Anda.');
            }

            $removeOldAttachment = isset($_POST['remove_attachment']) && $_POST['remove_attachment'] === '1';
            $attachmentPath = $newAttachment
                ?? ($removeOldAttachment ? null : $existingTask['attachment_path']);

            $statement = $pdo->prepare(
                'UPDATE tasks
                 SET owner_name = :owner_name, title = :title, description = :description,
                     notification_time = :notification_time, attachment_path = :attachment_path
                 WHERE id = :id'
            );
            $statement->execute([
                'owner_name' => $_SESSION['user_name'],
                'title' => $title,
                'description' => $description,
                'notification_time' => $notificationTime,
                'attachment_path' => $attachmentPath,
                'id' => $taskId,
            ]);

            if ($newAttachment !== null || $removeOldAttachment) {
                deleteTaskImage($existingTask['attachment_path']);
            }
            setFlash('success', 'Perubahan tugas berhasil disimpan.');
        }
    } elseif ($action === 'toggle') {
        $taskId = filter_var($_POST['task_id'] ?? null, FILTER_VALIDATE_INT);
        $completed = ($_POST['completed'] ?? '') === '1' ? 1 : 0;
        if ($taskId === false || $taskId === null || $taskId < 1) {
            throw new RuntimeException('Tugas yang ingin diperbarui tidak valid.');
        }

        $statement = $pdo->prepare(
            "UPDATE tasks SET completed = :completed
             WHERE id = :id
               AND (visibility = 'shared' OR (visibility = 'personal' AND owner_key = :owner_key))"
        );
        $statement->execute([
            'completed' => $completed,
            'id' => $taskId,
            'owner_key' => $_SESSION['owner_key'],
        ]);
        if ($statement->rowCount() === 0) {
            $statement = $pdo->prepare(
                "SELECT id FROM tasks
                 WHERE id = :id
                   AND (visibility = 'shared' OR (visibility = 'personal' AND owner_key = :owner_key))"
            );
            $statement->execute(['id' => $taskId, 'owner_key' => $_SESSION['owner_key']]);
            if ($statement->fetch() === false) {
                throw new RuntimeException('Tugas tidak ditemukan atau bukan milik sesi Anda.');
            }
        }
        setFlash('success', 'Status tugas berhasil diperbarui.');
    } elseif ($action === 'delete') {
        $taskId = filter_var($_POST['task_id'] ?? null, FILTER_VALIDATE_INT);
        if ($taskId === false || $taskId === null || $taskId < 1) {
            throw new RuntimeException('Tugas yang ingin dihapus tidak valid.');
        }

        $statement = $pdo->prepare(
            "SELECT id, attachment_path FROM tasks
             WHERE id = :id
               AND (visibility = 'shared' OR (visibility = 'personal' AND owner_key = :owner_key))"
        );
        $statement->execute(['id' => $taskId, 'owner_key' => $_SESSION['owner_key']]);
        $task = $statement->fetch();
        if ($task === false) {
            throw new RuntimeException('Tugas tidak ditemukan atau bukan milik sesi Anda.');
        }

        $statement = $pdo->prepare('DELETE FROM tasks WHERE id = :id');
        $statement->execute(['id' => $taskId]);
        deleteTaskImage($task['attachment_path']);
        setFlash('success', 'Tugas berhasil dihapus.');
    } else {
        throw new RuntimeException('Aksi tidak dikenal.');
    }
} catch (RuntimeException $error) {
    setFlash('error', $error->getMessage());
}

redirectToView($view);
