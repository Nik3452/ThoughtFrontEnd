$(document).ready(function() {
    const postsPerPage = 4;
    let posts = [];
    let isLoggedIn = false;
    let defaultTitle = document.title
    window.onblur = () => {
        document.title = "Please Come Back :("
    }
    window.onfocus = () => {
        document.title = defaultTitle
    }

    function displayPosts(page) {
        const start = (page - 1) * postsPerPage;
        const end = start + postsPerPage;
        const $blogPostsContainer = $('#blog-posts');
        if (!posts) {
            $blogPostsContainer.empty()
            $blogPostsContainer.append('<p>No Posts Have been Made! :(</p>');
            return;
        }
        const paginatedPosts = posts.slice(start, end);

        $blogPostsContainer.empty();

        paginatedPosts.forEach((post, index) => {
            const truncatedText = truncateText(post.text, 50);
            const postCard = `
            <div class="card mb-4">
                <div data-blog-id="${post.id}" class="card-body">
                    <h2 class="card-title">${post.title}</h2>
                    <p class="card-text">${truncatedText}</p>
                    <div>
                        <button class="btn btn-primary" data-toggle="modal" data-target="#postModal${index}">Read More</button>
                        <button class="btn btn-danger delete-blog-btn" data-blog-id="${post.id}" data-toggle="modal" data-target="#dangerModal" style="display: ${isLoggedIn ? 'block' : 'none'};">Delete</button>
                    </div>
                    <br><br>
                    <p>Author ${post.owner}</p>
                </div>
            </div>
            <div class="modal fade" id="postModal${index}">
                <div class="modal-dialog" data-dialog="modalDialogReadMore">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">${post.title}</h4>
                            <button type="button" class="close" data-dismiss="modal">&times;</button>
                        </div>
                        <div class="modal-body" data-body="modalBodyReadMore">
                            <p>${post.text}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
            $blogPostsContainer.append(postCard);
        });
    }

    function setupPagination() {
        const $paginationContainer = $('#pagination');
        if(!posts) {
            $paginationContainer.empty();
            return
        }
        const pageCount = Math.ceil(posts.length / postsPerPage);
        $paginationContainer.empty();

        for (let i = 1; i <= pageCount; i++) {
            const pageItem = $(`<li class="page-item"><a class="page-link" href="#">${i}</a></li>`);
            pageItem.on('click', function(e) {
                e.preventDefault();
                displayPosts(i);
            });
            $paginationContainer.append(pageItem);
        }
    }

    function refreshPosts() {
        $('#loadingSpinner').show(); // Show the spinner
        $.getJSON("http://localhost:8080/api/blogs")
            .done(function(response) {
                posts = response;
                displayPosts(1);
                setupCategories(response)
                setupPagination();
            })
            .fail(function(error) {
                console.log(error);
                window.location.href = 'error.html'; // Redirect to error page
            })
            .always(function() {
                $('#loadingSpinner').hide(); // Hide the spinner
            });
    }

    function setupCategories(response) {
        const listGroup = $('#categoryList')
        if(!response) {
            listGroup.empty()
            listGroup.append('<p>No Categories Available!</p>')
            return;
        }
        listGroup.empty()
        for(let i = 0; i < response.length; i++) {
            if(!listGroup.find(`#${response[i].category}item`).length) {
                listGroup.append(`<li class="list-group-item" id="${response[i].category}item">${response[i].category}</li>\n`)
            }
        }
    }
    function truncateText(text, maxLength) {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }

    $('#loginModalBtn').on('click', function(event) {
        event.preventDefault();
        const email = $('#email').val();
        const pass = $('#pwd').val();
        const body = {
            email: email,
            password: pass
        };
        $.ajax({
            url: "http://localhost:8080/api/users/login",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(body),
            success: function(response) {
                if (response === true) {
                    isLoggedIn = true;
                    $('#createBlogBtn').show();
                    $('#loginModal').modal('hide');
                    $('#loginErrorMessage').hide();
                    $('.delete-blog-btn').css('display', 'block');
                } else {
                    $('#loginErrorMessage').show();
                }
            },
            error: function(error) {
                console.log(error);
                $('#loginErrorMessage').show();
            }
        });
    });

    $('#submitBlogPostBtn').on('click', function() {
        const title = $('#blogTitle').val();
        const text = $('#blogText').val();
        const author = $('#blogOwner').val();
        const category = $('#blogCategory').val()
        const body = {
            title: title,
            owner: author,
            text: text,
            category: category
        };
        $.ajax({
            url: "http://localhost:8080/api/blogs",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(body),
            success: function(response) {
                $('#createBlogModal').modal('hide');
                refreshPosts();
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    $('#blog-posts').on('click', '.delete-blog-btn', function() {
        const blogId = $(this).data('blog-id');
        $('#deleteBlogBtn').data('blog-id', blogId);
    });

    $('#deleteBlogBtn').on('click', function(event) {
        event.preventDefault();
        const blogId = $(this).data('blog-id');
        $.ajax({
            url: `http://localhost:8080/api/blogs/${blogId}`,
            type: "DELETE",
            success: function(response) {
                refreshPosts();
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    refreshPosts();
});