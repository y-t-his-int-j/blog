<script lang="ts">
  import { categories, getPost, posts } from './lib/posts';

  let path = window.location.pathname;

  const siteTitle = 'MyThink';
  const siteDescription =
    'Personal notes on China, Hong Kong, language, memory, and East Asian culture.';

  $: activeSlug = path.match(/^\/post\/([^/]+)\/?$/)?.[1] ?? '';
  $: activePost = activeSlug ? getPost(activeSlug) : undefined;
  $: activeCategory = path.match(/^\/category\/([^/]+)\/?$/)?.[1] ?? '';
  $: visiblePosts = activeCategory
    ? posts.filter((post) => post.categories.includes(decodeURIComponent(activeCategory)))
    : posts;

  function navigate(event: MouseEvent, href: string) {
    event.preventDefault();
    history.pushState(null, '', href);
    path = window.location.pathname;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('popstate', () => {
    path = window.location.pathname;
  });
</script>

<svelte:head>
  <title>{activePost ? `${activePost.title} | ${siteTitle}` : siteTitle}</title>
</svelte:head>

<header class="site-header">
  <a class="brand" href="/" on:click={(event) => navigate(event, '/')}>{siteTitle}</a>
  <nav aria-label="Primary navigation">
    <a href="/" on:click={(event) => navigate(event, '/')}>Writing</a>
    <a href="/#about">About</a>
  </nav>
</header>

{#if activePost}
  <main class="post-shell">
    <a class="back-link" href="/" on:click={(event) => navigate(event, '/')}>Back to all writing</a>

    <article class="post-detail">
      <header class="post-hero">
        {#if activePost.image}
          <img src={activePost.image} alt="" loading="eager" />
        {/if}
        <div>
          <p class="meta">{activePost.displayDate} · {activePost.author}</p>
          <h1>{activePost.title}</h1>
          <div class="category-row" aria-label="Categories">
            {#each activePost.categories as category}
              <a href={`/category/${category}`} on:click={(event) => navigate(event, `/category/${category}`)}>
                {category}
              </a>
            {/each}
          </div>
        </div>
      </header>

      <div class="prose">
        {@html activePost.html}
      </div>
    </article>
  </main>
{:else}
  <main>
    <section class="intro" id="about">
      <p class="eyebrow">Essays and notes</p>
      <h1>{siteTitle}</h1>
      <p>{siteDescription}</p>
    </section>

    {#if categories.length}
      <section class="filters" aria-label="Post categories">
        <a class:active={!activeCategory} href="/" on:click={(event) => navigate(event, '/')}>All</a>
        {#each categories as category}
          <a
            class:active={decodeURIComponent(activeCategory) === category}
            href={`/category/${category}`}
            on:click={(event) => navigate(event, `/category/${category}`)}
          >
            {category}
          </a>
        {/each}
      </section>
    {/if}

    <section class="post-list" aria-label="Posts">
      {#each visiblePosts as post}
        <article class="post-card">
          {#if post.image}
            <a href={`/post/${post.slug}`} on:click={(event) => navigate(event, `/post/${post.slug}`)}>
              <img src={post.image} alt="" loading="lazy" />
            </a>
          {/if}
          <div>
            <p class="meta">{post.displayDate} · {post.author}</p>
            <h2>
              <a href={`/post/${post.slug}`} on:click={(event) => navigate(event, `/post/${post.slug}`)}>
                {post.title}
              </a>
            </h2>
            <p>{post.excerpt}</p>
          </div>
        </article>
      {:else}
        <p class="empty">No posts found for this category.</p>
      {/each}
    </section>
  </main>
{/if}

<footer>
  <p>Writing what I want.</p>
</footer>
