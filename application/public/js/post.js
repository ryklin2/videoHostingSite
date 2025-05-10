document.addEventListener('DOMContentLoaded', function() {
    const likeButton = document.getElementById('likeButton');
    const commentForm = document.getElementById('commentForm');
    const likesCountElement = document.getElementById('likesCount');
    const deleteForm = document.getElementById('deletePostForm');

    
    if (deleteForm) {
        deleteForm.addEventListener('submit', function(e) {
            if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
                e.preventDefault();
            }
        });
    }


    if (likeButton) {
        likeButton.addEventListener('click', function() {
            const postId = this.dataset.postId;
            const isLiked = this.dataset.liked === 'true';
            const url = `/post/${postId}/${isLiked ? 'unlike' : 'like'}`;

            fetch(url, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.textContent = isLiked ? 'Like' : 'Unlike';
                        this.dataset.liked = isLiked ? 'false' : 'true';
                        likesCountElement.textContent = data.likes;
                        likesCountElement.classList.add('liked-animation');
                        setTimeout(() => likesCountElement.classList.remove('liked-animation'), 300);
                    } else {
                        console.error('Failed to update like:', data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        });
    }

    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const postId = this.dataset.postId;
            const contentTextarea = this.querySelector('textarea[name="content"]');
            const content = contentTextarea.value.trim();

            if (content) {
                fetch(`/post/${postId}/comment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content }),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        contentTextarea.value = '';
                        updateCommentsList(data.comments);
                    } else {
                        console.error('Failed to add comment:', data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            }
        });
    }
});

function updateCommentsList(comments) {
    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = comments.map(comment => `
        <li class="comment">
            <p>${escapeHtml(comment.content)}</p>
            <p>By: <strong>${escapeHtml(comment.username)}</strong> on ${new Date(comment.created_at).toLocaleString()}</p>
        </li>
    `).join('');
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}