---
short-description: Description of the pre-defined app experiencies or presets
...
# Presets

The Modular framework has been used for building dozens of apps. As a result, many experience patterns have emerged and turned into pre-defined app experiences or presets. These presets can be re-used and customized by app developers to create new apps. This document is meant to present and describe each of these presets.

## Library

![The Library preset](images/presets/library.svg)

Library is a focused experience that guides the user directly to the content through categories. The preset highlights a few featured categories first before revealing all categories, and integrates a table of contents in the article view. Recommended for long-form educational content.

* **Requires** one level of categories.
* Supports HTML, PDF, video and audio articles.

To use it, include this in your app's YAML:

```yaml
!import 'library'
```

## Blog

![The Blog preset](images/presets/blog.svg)

Blog is an exploratory experience that starts the user off with fresh content on the homepage, and integrates a fixed side menu for ease of navigation between categories (if the content has categories). If the user can't find what they're looking for, the app will suggest new content. Recommended for blog posts from individual authors.

* Does not require categories.
* Supports one level of categories and tags.
* Supports HTML, PDF, video and audio articles.

To use it, include this in your app's YAML:

```yaml
!import 'blog'
```

## Thematic (B)

![The Thematic (B) preset](images/presets/B.svg)

Thematic (B) is a focused experience that guides the user directly to the content through a few large categories, and integrates a fixed side menu in the article view to explore more content in that category. Originally designed to be a more visual iteration of the Library preset, and recommended for long-form educational content.

* **Requires** one level of categories.
* Supports HTML, PDF, video and audio articles.

To use it, include this in your app's YAML:

```yaml
!import 'B'
```

## Buffet

![The Buffet preset](images/presets/buffet.svg)

Buffet is a highly exploratory experience that aims to provide no restrictions to the user’s curiosity. The preset allows the user to view fresh content from the beginning, navigate freely and easily among categories and sub-categories, and find more content along the way. It integrates a sliding side menu for more constant navigation control.

* **Requires** that each article belongs to two categories, at least.
* Supports HTML and PDF articles.

To use it, include this in your app's YAML:

```yaml
!import 'buffet'
```

## Encyclopedia

![The Encyclopedia preset](images/presets/encyclopedia.svg)

Encyclopedia is a search-based experience, allowing the user to simply search a one-dimensional content structure and browse the results.

* **Does not** support categories.
* Supports HTML and PDF articles.

To use it, include this in your app's YAML:

```yaml
!import 'encyclopedia'
```

## Escola

![The Escola preset](images/presets/escola.svg)

Escola is a focused experience that guides the user directly to the content through categories. Recommended for sequential educational content.

* **Requires** one level of categories.
* Supports video and audio articles.

To use it, include this in your app's YAML:

```yaml
!import 'escola'
```

## Gallery

![The Gallery preset](images/presets/gallery.svg)

Gallery is a highly exploratory experience that entices the user from the beginning with fresh, visual content, integrating a fixed top menu for more constant navigation control. If the user can't find what they're looking for, the app will suggest new content. Recommended for highly visual, exploratory content.

* Does not require categories.
* Supports one level of categories.
* Supports HTML, PDF and video articles.

To use it, include this in your app's YAML:

```yaml
!import 'gallery'
```

## Library List

![The Library List preset](images/presets/library-list.svg)

Library-List is a variation of the Library preset that offers a similarly focused experience, guiding the user directly to the content through categories, with the addition of sub-categories. Recommended for long-form educational content.

* **Requires** two levels of categories.
* Supports HTML, PDF, video and audio articles.

To use it, include this in your app's YAML:

```yaml
!import 'library-list'
```

## News

![The News preset](images/presets/news.svg)

News is a highly exploratory reader experience that allows the user to view fresh content from the beginning, lightly guiding the user with category and sub-category previews and opportunities to find new content along the way. It integrates a top menu for more constant navigation control. Recommended for ephemeral news content.

* **Requires** one level of categories, at least.
* Supports HTML, PDF, video and audio articles.

To use it, include this in your app's YAML:

```yaml
!import 'news'
```

## Video List

![The Video List preset](images/presets/video_list.svg)

Video-List is a one-dimensional experience, aimed to allow the user to traverse a simple content structure easily. Recommended for linear, single-topic video tutorials.

* **Does not** support categories.
* Supports video articles.

To use it, include this in your app's YAML:

```yaml
!import 'video_list'
```

