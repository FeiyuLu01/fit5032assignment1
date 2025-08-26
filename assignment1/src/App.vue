<script setup>
</script>

<template>
  <div>
    <!-- 顶部导航栏 -->
    <nav class="navbar navbar-expand-lg bg-light border-bottom">
      <div class="container">
        <RouterLink to="/" class="navbar-brand fw-bold">🏀 Basketball Hub</RouterLink>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div id="nav" class="collapse navbar-collapse">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <RouterLink to="/" class="nav-link">Home</RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink to="/courts" class="nav-link">Court Finder</RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- 页面内容 -->
    <main class="container py-4 fade-in">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.fade-in {
  animation: fadein 0.5s ease-out;
}
@keyframes fadein {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>