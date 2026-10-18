<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#17231d">
    <title><?= $view === 'shared' ? 'Shared tasks' : 'Personal tasks' ?> - TODO SASKARA</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body class="light-mode">
    <div class="app-shell">
        <?php require __DIR__ . '/menu-bar.php'; ?>

        <div class="main-column">
            <header class="app-header">
                <div class="page-heading">
                    <p class="eyebrow"><?= $view === 'shared' ? 'KERJA BERSAMA' : 'RUANG PRIBADI' ?></p>
                    <h1><?= $view === 'shared' ? 'Shared tasks' : 'Personal tasks' ?></h1>
                    <p class="subtitle"><?= $view === 'shared' ? 'Satu daftar tugas untuk dikerjakan bersama.' : 'Satu langkah kecil untuk hari yang lebih terarah.' ?></p>
                </div>
                <div class="header-actions">
                    <form class="profile-form" action="actions.php" method="post">
                        <input type="hidden" name="csrf_token" value="<?= escape(csrfToken()) ?>">
                        <input type="hidden" name="action" value="set_name">
                        <input type="hidden" name="view" value="<?= escape($view) ?>">
                        <label for="userName">Nama Anda</label>
                        <input id="userName" name="user_name" maxlength="80" value="<?= escape($_SESSION['user_name']) ?>" required>
                        <button type="submit" class="profile-save">Simpan</button>
                    </form>
                    <button id="enableNotifications" class="notifications-toggle" type="button">Aktifkan pengingat</button>
                    <button id="themeToggle" class="theme-toggle" type="button" aria-label="Ganti ke mode gelap">🌙</button>
                </div>
            </header>

            <main class="content-layout">
                <?php if ($flash !== null): ?>
                    <div class="flash-message <?= escape($flash['type']) ?>" role="status"><?= escape($flash['message']) ?></div>
                <?php endif; ?>

                <section class="todo-card" aria-labelledby="list-title">
                    <div class="list-heading">
                        <div>
                            <p class="panel-label"><?= $view === 'shared' ? 'DAFTAR TIM' : 'DAFTAR UTAMA' ?></p>
                            <h2 id="list-title"><?= $view === 'shared' ? 'Tugas bersama' : 'Tugas pribadi' ?></h2>
                        </div>
                        <span><?= count($tasks) ?> tugas · <?= $completedCount ?> selesai</span>
                    </div>

                    <?php if ($tasks === []): ?>
                        <div class="empty-state">
                            <span aria-hidden="true">✦</span>
                            <h3>Belum ada tugas</h3>
                            <p><?= $view === 'shared' ? 'Tambahkan tugas pertama untuk mulai berkolaborasi.' : 'Tambahkan tugas pribadi Anda menggunakan formulir.' ?></p>
                        </div>
                    <?php else: ?>
                        <ul class="task-list" aria-live="polite">
                            <?php foreach ($tasks as $task): ?>
                                <li class="task-item <?= (bool) $task['completed'] ? 'completed' : '' ?>"<?php if (!(bool) $task['completed'] && $task['notification_time'] !== null): ?> data-reminder-time="<?= escape(substr((string) $task['notification_time'], 0, 5)) ?>" data-task-title="<?= escape($task['title']) ?>"<?php endif; ?>>
                                    <form class="completion-form" action="actions.php" method="post">
                                        <input type="hidden" name="csrf_token" value="<?= escape(csrfToken()) ?>">
                                        <input type="hidden" name="action" value="toggle">
                                        <input type="hidden" name="view" value="<?= escape($view) ?>">
                                        <input type="hidden" name="task_id" value="<?= (int) $task['id'] ?>">
                                        <input type="hidden" name="completed" value="<?= (bool) $task['completed'] ? '0' : '1' ?>">
                                        <button class="task-check <?= (bool) $task['completed'] ? 'checked' : '' ?>" type="submit" aria-label="<?= (bool) $task['completed'] ? 'Tandai belum selesai' : 'Tandai selesai' ?>: <?= escape($task['title']) ?>">
                                            <?= (bool) $task['completed'] ? '✓' : '' ?>
                                        </button>
                                    </form>
                                    <div class="task-copy">
                                        <h3 class="task-text"><?= escape($task['title']) ?></h3>
                                        <?php if ($task['description'] !== ''): ?>
                                            <p><?= nl2br(escape($task['description'])) ?></p>
                                        <?php endif; ?>
                                        <div class="task-meta">
                                            <?php if ($task['notification_time'] !== null): ?>
                                                <span>◷ <?= escape(substr((string) $task['notification_time'], 0, 5)) ?></span>
                                            <?php endif; ?>
                                            <?php if ($view === 'shared'): ?>
                                                <span>Oleh <?= escape($task['owner_name']) ?></span>
                                            <?php endif; ?>
                                        </div>
                                        <?php if ($task['attachment_path'] !== null): ?>
                                            <a class="attachment-link" href="<?= escape($task['attachment_path']) ?>" target="_blank" rel="noopener">Lihat lampiran</a>
                                        <?php endif; ?>
                                    </div>
                                    <div class="task-actions">
                                        <a class="task-action" href="index.php?view=<?= escape($view) ?>&amp;edit=<?= (int) $task['id'] ?>">Edit</a>
                                        <form action="actions.php" method="post" data-confirm="Hapus tugas ini?">
                                            <input type="hidden" name="csrf_token" value="<?= escape(csrfToken()) ?>">
                                            <input type="hidden" name="action" value="delete">
                                            <input type="hidden" name="view" value="<?= escape($view) ?>">
                                            <input type="hidden" name="task_id" value="<?= (int) $task['id'] ?>">
                                            <button class="task-action delete-btn" type="submit">Hapus</button>
                                        </form>
                                    </div>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>
                </section>

                <aside class="side-panel" aria-label="Formulir tugas">
                    <section class="form-card" aria-labelledby="form-title">
                        <p class="panel-label"><?= $editTask !== null ? 'PERBARUI DAFTAR' : 'TUGAS BARU' ?></p>
                        <h2 id="form-title"><?= $editTask !== null ? 'Edit tugas' : 'Tambah tugas' ?></h2>
                        <form action="actions.php" method="post" enctype="multipart/form-data" class="task-form">
                            <input type="hidden" name="csrf_token" value="<?= escape(csrfToken()) ?>">
                            <input type="hidden" name="action" value="<?= $editTask !== null ? 'update' : 'create' ?>">
                            <input type="hidden" name="view" value="<?= escape($view) ?>">
                            <?php if ($editTask !== null): ?>
                                <input type="hidden" name="task_id" value="<?= (int) $editTask['id'] ?>">
                            <?php endif; ?>

                            <label for="taskTitle">Nama tugas</label>
                            <input id="taskTitle" name="title" type="text" placeholder="Contoh: Rapat tim desain" maxlength="160" value="<?= escape($editTask['title'] ?? '') ?>" required>

                            <label for="taskDescription">Deskripsi</label>
                            <textarea id="taskDescription" name="description" rows="4" maxlength="2000" placeholder="Tambahkan detail tugas..."><?= escape($editTask['description'] ?? '') ?></textarea>

                            <label for="notificationTime">Waktu pengingat (opsional)</label>
                            <input id="notificationTime" name="notification_time" type="time" value="<?= escape(isset($editTask['notification_time']) ? substr((string) $editTask['notification_time'], 0, 5) : '') ?>">

                            <label for="taskImage">Lampiran foto (maks. 5 MB)</label>
                            <input id="taskImage" name="attachment" type="file" accept="image/jpeg,image/png,image/gif,image/webp">
                            <?php if ($editTask !== null && $editTask['attachment_path'] !== null): ?>
                                <p class="current-attachment">Lampiran saat ini: <a href="<?= escape($editTask['attachment_path']) ?>" target="_blank" rel="noopener">lihat foto</a></p>
                                <label class="remove-attachment"><input type="checkbox" name="remove_attachment" value="1"> Hapus lampiran lama</label>
                            <?php endif; ?>
                            <img id="taskImagePreview" class="task-preview hidden" alt="Pratinjau lampiran">
                            <button class="submit-btn" type="submit"><?= $editTask !== null ? 'Simpan perubahan' : 'Tambah ke ' . ($view === 'shared' ? 'Shared' : 'Personal') ?></button>
                            <?php if ($editTask !== null): ?>
                                <a class="cancel-edit" href="index.php?view=<?= escape($view) ?>">Batal mengedit</a>
                            <?php endif; ?>
                        </form>
                    </section>

                    <section class="detail-card">
                        <p class="panel-label">TENTANG DAFTAR</p>
                        <h2><?= $view === 'shared' ? 'Ruang kolaborasi' : 'Ruang pribadi' ?></h2>
                        <p><?= $view === 'shared' ? 'Tugas di daftar Shared dapat dilihat dan dikelola bersama oleh siapa pun yang terhubung ke database ini.' : 'Tugas Personal hanya terlihat pada sesi browser Anda. Gunakan Shared untuk berkolaborasi.' ?></p>
                        <p class="scope-note">Sesi aktif sebagai <strong><?= escape($_SESSION['user_name']) ?></strong></p>
                    </section>
                </aside>
            </main>

            <footer>
                <span>5025251205</span>
                <span>I Made Saskara Bawa</span>
            </footer>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
