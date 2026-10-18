<aside class="sidebar">
    <a class="brand" href="index.php" aria-label="Todo Saskara beranda">
        <span class="brand-mark" aria-hidden="true">T</span>
        <span>
            <strong>TODO SASKARA</strong>
            <small>RUANG KERJA HARIAN</small>
        </span>
    </a>

    <p class="sidebar-label">WORKSPACE</p>
    <nav class="workspace-nav" aria-label="Daftar tugas">
        <a class="nav-link <?= $view === 'personal' ? 'active' : '' ?>" href="index.php?view=personal" <?= $view === 'personal' ? 'aria-current="page"' : '' ?>>
            <span class="nav-icon" aria-hidden="true">◷</span>
            <span>Personal</span>
            <?php if ($view === 'personal'): ?><span class="nav-dot" aria-hidden="true"></span><?php endif; ?>
        </a>
        <a class="nav-link <?= $view === 'shared' ? 'active' : '' ?>" href="index.php?view=shared" <?= $view === 'shared' ? 'aria-current="page"' : '' ?>>
            <span class="nav-icon" aria-hidden="true">◎</span>
            <span>Shared</span>
            <?php if ($view === 'shared'): ?><span class="nav-dot" aria-hidden="true"></span><?php endif; ?>
        </a>
    </nav>

    <div class="sidebar-note">
        <span class="online-dot" aria-hidden="true"></span>
        <span>Database tersambung</span>
    </div>
</aside>
