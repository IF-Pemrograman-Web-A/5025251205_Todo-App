<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

$view = ($_GET['view'] ?? 'personal') === 'shared' ? 'shared' : 'personal';
$editTask = null;
$requestedEditId = filter_var($_GET['edit'] ?? null, FILTER_VALIDATE_INT);

if ($requestedEditId !== false && $requestedEditId !== null && $requestedEditId > 0) {
    $statement = $pdo->prepare(
        "SELECT * FROM tasks
         WHERE id = :id
           AND (visibility = 'shared' OR (visibility = 'personal' AND owner_key = :owner_key))"
    );
    $statement->execute([
        'id' => $requestedEditId,
        'owner_key' => $_SESSION['owner_key'],
    ]);
    $editTask = $statement->fetch() ?: null;

    if ($editTask !== null) {
        $view = $editTask['visibility'];
    }
}

$statement = $pdo->prepare(
    "SELECT * FROM tasks
     WHERE visibility = :visibility
       AND (visibility = 'shared' OR owner_key = :owner_key)
     ORDER BY completed ASC, created_at DESC, id DESC"
);
$statement->execute([
    'visibility' => $view,
    'owner_key' => $_SESSION['owner_key'],
]);
$tasks = $statement->fetchAll();
$flash = takeFlash();
$completedCount = count(array_filter($tasks, static fn (array $task): bool => (bool) $task['completed']));

require __DIR__ . '/content.php';
