<script setup>
</script>

<template>
  <div>
    <nav class="navbar navbar-expand-lg bg-light border-bottom">
      <div class="container">
        <RouterLink to="/" class="navbar-brand fw-bold">🏀 Basketball Hub</RouterLink>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div id="nav" class="collapse navbar-collapse">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <RouterLink
                :to="{ name: 'home' }"
                class="nav-link custom-link"
                :class="{ active: $route.name === 'home' }"
              >
                Home
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink
                :to="{ name: 'courts' }"
                class="nav-link custom-link"
                :class="{ active: $route.name === 'courts' }"
              >
                Court Finder
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <main class="container py-4 fade-in">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.fade-in {
  animation: fadein .5s ease-out;
}
@keyframes fadein {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}

.custom-link.active {
  color: var(--bs-primary) !important;
  font-weight: 600;
  border-bottom: 3px solid var(--bs-primary);
  padding-bottom: 4px;
}
</style>