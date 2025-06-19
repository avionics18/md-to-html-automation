# Introduction

Static Site Generation (SSG) is a web development technique where a website's HTML pages are pre-built during the build process, rather than being dynamically generated on-demand by the server for each user request. This means that when a user visits a static website, the pre-built HTML, CSS, and JavaScript files are served directly to their browser without any server-side processing.

**Headless CMS Examples to use with SSG:**

- [Agility CMS](https://next-blog-agilitycms.vercel.app/)
- [Builder.io CMS](https://cms-builder-io.vercel.app/)
- [Butter CMS](https://next-blog-buttercms.vercel.app/)
- [Contentful CMS](https://app-router-contentful.vercel.app/)
- [Dato CMS](https://next-blog-datocms.vercel.app/)

If a page uses Static Generation, the page HTML is generated at build time. That means in production, the page HTML is generated when you run `next build`. This HTML will then be reused on each request. It can be cached by a CDN.

In Next.js, you can statically generate pages with or without data. Let's take a look at each case.

## Static Generation without data

By default, Next.js pre-renders pages using Static Generation without fetching data. Here's an example:

```jsx
function About() {
  return <div>About</div>
}
 
export default About
```

Note that this page does not need to fetch any external data to be pre-rendered. In cases like this, Next.js generates a single HTML file per page during build time.

## Static Generation with data

Some pages require fetching external data for pre-rendering. There are two scenarios, and one or both might apply. In each case, you can use these functions that Next.js provides:

1. Your page content depends on external data: Use `getStaticProps`.
2. Your page paths depend on external data: Use `getStaticPaths` (usually in addition to `getStaticProps`).

### Scenario 1: Your page content depends on external data

**Example**: Your blog page might need to fetch the list of blog posts from a CMS (content management system).

```jsx
// TODO: Need to fetch `posts` (by calling some API endpoint)
//       before this page can be pre-rendered.
export default function Blog({ posts }) {
  return (
    <ul>
      {posts.map((post) => (
        <li>{post.title}</li>
      ))}
    </ul>
  )
}
```

To fetch this data on pre-render, Next.js allows you to `export` an `async` function called `getStaticProps` from the same file. This function gets called at build time and lets you pass fetched data to the page's `props` on pre-render.

### Scenario 2: Your page paths depend on external data

Next.js allows you to create pages with dynamic routes. For example, you can create a file called `pages/posts/[id]`.js to show a single blog post based on id. This will allow you to show a blog post with `id: 1` when you access `posts/1`.

> To learn more about dynamic routing, check the [Dynamic Routing documentation](https://nextjs.org/docs/pages/building-your-application/routing/dynamic-routes).

However, which `id` you want to pre-render at build time might depend on external data.

Example: suppose that you've only added one blog post (with `id: 1`) to the database. In this case, you'd only want to pre-render `posts/1` at build time.

Later, you might add the second post with `id: 2`. Then you'd want to pre-render `posts/2` as well.

So your page paths that are pre-rendered depend on external data. To handle this, Next.js lets you `export` an `async` function called `getStaticPaths` from a dynamic page (`pages/posts/[id].js` in this case). This function gets called at build time and lets you specify which paths you want to pre-render.