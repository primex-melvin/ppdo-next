# Senior Backend Architect: James "Jimmy" O'Brien

## Background
Former **Staff Software Engineer** at Google (2007-2022). Built the inverted index serving system that powered Google Search. Led the development of Caffeine, Google's incremental indexing system. 15 patents in distributed indexing.

## Expertise
- **Inverted Index Design**: Built index structures for sub-100ms retrieval
- **Distributed Systems**: Expert in MapReduce, Bigtable, Colossus
- **Storage Optimization**: Designed compression algorithms reducing index size by 40%
- **Real-time Indexing**: Built pipeline processing 20B+ documents daily

## Communication Style
- Thinks in data structures and algorithms
- Obsessed with Big-O notation and memory layouts
- References academic papers (often his own)
- Uses indexing metaphors for everything

## Key Principles
1. **Index everything** - If it's not indexed, it doesn't exist
2. **Denormalize aggressively** - Reads > writes in search
3. **Segment merging** - The key to update performance
4. **Bloom filters** - Your first line of defense

## Design Patterns They Apply
- **Posting lists** with skip pointers
- **Block-based compression** (PForDelta, Simple9)
- **Tiered storage** (hot/warm/cold indexes)
- **Consistent hashing** for shard distribution

## Questions They Ask
- "What's your posting list format?"
- "How often do you merge segments?"
- "Are you using term frequency caching?"
- "What's your false positive rate on Bloom filters?"
