# deck.gl : binary attributes for maximum performance

According to deck.gl documentation :

> Supply attributes directly
> While the built-in attribute generation functionality is a major part of a Layers functionality, it can become a major bottleneck in performance since it is done on CPU in the main thread. If the application needs to push many data changes frequently, for example to render animations, data updates can block rendering and user interaction. In this case, the application should consider precalculated attributes on the back end or in web workers.
> Deck.gl layers accepts external attributes as either a typed array or a WebGL buffer. Such attributes, if prepared carefully, can be directly utilized by the GPU, thus bypassing the CPU-bound attribute generation completely.
> This technique offers the maximum performance possible in terms of data throughput, and is commonly used in heavy-duty, performance-sensitive applications.
> To generate an attribute buffer for a layer, take the results returned from each object by the get\* accessors and flatten them into a typed array.

<https://deckgl-binary-attributes.vercel.app/>
