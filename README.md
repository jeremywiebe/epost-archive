# ePost Archiver

## Introduction and use

Extracts all PDFs in your account... because ePost makes it frustratingly difficult to get them in a batch.

```
$ yarn install
# Get some values from the website using your browser dev tools
# Place them in config.js (copy config.example.js if needed)
$ node index.js
$ ls downloads
```

✨

## Known Issues

* Some entries seem to appear twice (same ID and short description). I _think_
  this is maybe re-issue of the same document or some mail status change. I
  haven't figured it out, but it seems to give the right results if we simply
  overwrite with the later items.

* The tool always re-downloads everything. All existing files may be
  overwritten (it doesn't delete anything to start, but doesn't prevent
  overwriting an existing file if it already exists).
