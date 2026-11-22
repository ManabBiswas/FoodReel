/**
 * Strip private fields from a post before it goes into a public feed.
 * `likes` stays as an array so the client can still show the signed-in
 * user's own liked state, but only that user's id survives.
 */
export const publicPost = (post, userId) => {
    if (!post) return post;
    const likes = (post.likes || []).filter((id) =>
        userId && String(id?._id ?? id) === String(userId)
    );
    const { comments, ...safe } = post;
    return { ...safe, likes, isLiked: likes.length > 0 };
};

export const publicPosts = (posts, userId) => (posts || []).map((post) => publicPost(post, userId));
