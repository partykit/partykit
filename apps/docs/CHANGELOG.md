# @partykit/docs

## 0.0.2

### Patch Changes

- [#329](https://github.com/partykit/partykit/pull/329) [`9a55f69`](https://github.com/partykit/partykit/commit/9a55f69dee39267faf02204821b724c826870d39) Thanks [@threepointone](https://github.com/threepointone)! - change naming of /server exports

  This changes the naming of our exported types from `partykit/server`. The motivation here was aesthetic/simplification. Most of the exports los the `Party` prefix; i.e. `PartyServer` becomes `Server`, `PartyConnection` becomes `Connection`, and so on. If you look at the class example, this doesn't drastically change the code; the import becomes a lot shorter (`import type * as Party from 'partykit/server'` gets all the required types) and required types are taken by `Party.*`.

  I also did a run on all the docs/templates and the blog post, but lemme know if I missed anything!
