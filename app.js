const bookForm = document.getElementById("book-form");
const bookList = document.getElementById("book-list");

let books = JSON.parse(localStorage.getItem("mylibraryBooks")) || [];

function saveBooks() {
  localStorage.setItem("mylibraryBooks", JSON.stringify(books));
}

function displayBooks() {
  bookList.innerHTML = "";

  if (books.length === 0) {
    bookList.innerHTML = "<p>You have not added any books yet.</p>";
    return;
  }

  books.forEach(function (book, index) {
    const bookCard = document.createElement("div");
    bookCard.classList.add("book-card");

    bookCard.innerHTML = `
      <h3>${book.title}</h3>
      <p>by ${book.author}</p>
      <p><strong>Status:</strong> ${book.status}</p>
      <button class="delete-button" data-index="${index}">
        Delete
      </button>
    `;

    bookList.appendChild(bookCard);
  });
}

bookForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const status = document.getElementById("status").value;

  const newBook = {
    title: title,
    author: author,
    status: status
  };

  books.push(newBook);

  saveBooks();
  displayBooks();

  bookForm.reset();
});

bookList.addEventListener("click", function (event) {
  if (event.target.classList.contains("delete-button")) {
    const bookIndex = Number(event.target.dataset.index);

    books.splice(bookIndex, 1);

    saveBooks();
    displayBooks();
  }
});

displayBooks();