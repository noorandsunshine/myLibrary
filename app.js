const bookForm = document.getElementById("book-form");
const bookList = document.getElementById("book-list");
const isbnInput = document.getElementById("isbn");
const lookupButton = document.getElementById("lookup-button");
const lookupMessage = document.getElementById("lookup-message");
const scanButton = document.getElementById("scan-button");
const scannerContainer = document.getElementById("scanner-container");
const stopScanButton = document.getElementById("stop-scan-button");
const coverUpload = document.getElementById("cover-upload");
const barcodeScanner = new Html5Qrcode("barcode-reader");


let isScanning = false;

async function lookupBook(isbnValue) {
  const isbn = isbnValue.replace(/[^0-9X]/gi, "");

  if (isbn.length !== 10 && isbn.length !== 13) {
    lookupMessage.textContent = "Enter a valid 10- or 13-digit ISBN.";
    return;
  }

  lookupButton.disabled = true;
  lookupMessage.textContent = "Looking for your book...";

  try {
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );

    if (!response.ok) {
      throw new Error("The book service could not be reached.");
    }

    const data = await response.json();
    const book = data[`ISBN:${isbn}`];

    if (!book) {
      lookupMessage.textContent =
        "No book was found. You can still enter its details manually.";
      return;
    }

    document.getElementById("title").value = book.title || "";

    document.getElementById("author").value =
      book.authors?.map(function (author) {
        return author.name;
      }).join(", ") || "";

          const pagesInput = document.getElementById("pages");
    const publishDateInput = document.getElementById("publish-date");
    const coverUrlInput = document.getElementById("cover-url");
    const coverPreview = document.getElementById("cover-preview");
    const coverPreviewContainer = document.getElementById(
      "cover-preview-container"
    );

    pagesInput.value = book.number_of_pages || "";
    publishDateInput.value = book.publish_date || "";

    const coverUrl = book.cover?.medium || book.cover?.large || "";
    coverUrlInput.value = coverUrl;

    if (coverUrl) {
      coverPreview.src = coverUrl;
      coverPreviewContainer.hidden = false;
    } else {
      coverPreview.removeAttribute("src");
      coverPreviewContainer.hidden = true;
    }

    isbnInput.value = isbn;
    lookupMessage.textContent =
      "Book found! Review the information before adding it.";
  } catch (error) {
    console.error(error);
    lookupMessage.textContent =
      "Something went wrong. Please try again or enter the book manually.";
  } finally {
    lookupButton.disabled = false;
  }
}

lookupButton.addEventListener("click", function () {
  lookupBook(isbnInput.value);
});

function compressCoverImage(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const image = new Image();

      image.onload = function () {
        const maximumWidth = 360;
        const maximumHeight = 540;
        const scale = Math.min(
          maximumWidth / image.width,
          maximumHeight / image.height,
          1
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };

      image.onerror = reject;
      image.src = event.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

coverUpload.addEventListener("change", async function () {
  const selectedFile = coverUpload.files[0];

  if (!selectedFile) {
    return;
  }

  lookupMessage.textContent = "Preparing your cover image...";

  try {
    const compressedImage = await compressCoverImage(selectedFile);

    const coverUrlInput = document.getElementById("cover-url");
    const coverPreview = document.getElementById("cover-preview");
    const coverPreviewContainer = document.getElementById(
      "cover-preview-container"
    );

    coverUrlInput.value = compressedImage;
    coverPreview.src = compressedImage;
    coverPreviewContainer.hidden = false;

    lookupMessage.textContent =
      "Cover image ready! Review the book before adding it.";
  } catch (error) {
    console.error(error);
    lookupMessage.textContent =
      "That image could not be prepared. Please choose another.";
  }
});

async function stopScanner() {
  if (!isScanning) {
    return;
  }

  await barcodeScanner.stop();
  isScanning = false;
  scannerContainer.hidden = true;
  scanButton.disabled = false;
}

scanButton.addEventListener("click", async function () {
  scannerContainer.hidden = false;
  scanButton.disabled = true;
  lookupMessage.textContent = "Point your camera at the book’s barcode.";

  try {
    await barcodeScanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: {
          width: 280,
          height: 120
        },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13
        ]
      },
      async function (decodedText) {
        const isbn = decodedText.replace(/\D/g, "");

        if (!isbn.startsWith("978") && !isbn.startsWith("979")) {
          lookupMessage.textContent =
            "That barcode is not an ISBN. Try the book barcode again.";
          return;
        }

        await stopScanner();

        isbnInput.value = isbn;
        lookupMessage.textContent = "Barcode scanned! Finding your book...";

        lookupBook(isbn);
      },
      function () {
        // The scanner keeps looking while no barcode is detected.
      }
    );

    isScanning = true;
  } catch (error) {
    console.error(error);
    scannerContainer.hidden = true;
    scanButton.disabled = false;
    lookupMessage.textContent =
      "The camera could not start. Check your camera permission and try again.";
  }
});

stopScanButton.addEventListener("click", function () {
  stopScanner();
  lookupMessage.textContent = "Camera stopped.";
});

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

    const coverUrl =
      book.coverUrl ||
      (book.isbn
        ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg?default=false`
        : "");
      
    bookCard.innerHTML = `
    
          ${
        coverUrl
          ? `<img
              class="book-cover"
              src="${coverUrl}"
              alt="Book cover"
              onerror="this.hidden = true"
            >`
          : ""
      }

      <h3>${book.title}</h3>
          <p>by ${book.author}</p>
                ${book.isbn ? `<p><strong>ISBN:</strong> ${book.isbn}</p>` : ""}
                ${book.pages ? `<p><strong>Pages:</strong> ${book.pages}</p>` : ""}
               ${
        book.publishDate
          ? `<p><strong>Published:</strong> ${book.publishDate}</p>`
          : ""
      }
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

  const isbn = isbnInput.value.replace(/[^0-9X]/gi, "");
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const status = document.getElementById("status").value;

  const pages = document.getElementById("pages").value;
  const publishDate = document.getElementById("publish-date").value.trim();
  const coverUrl = document.getElementById("cover-url").value;

  const duplicateBook = books.find(function (book) {
    return isbn && book.isbn === isbn;
  });

  if (duplicateBook) {
    lookupMessage.textContent =
      `"${duplicateBook.title}" is already in your library.`;
    return;
  }

    const newBook = {
    isbn: isbn,
    title: title,
    author: author,
    pages: pages,
    publishDate: publishDate,
    coverUrl: coverUrl,
    status: status
  };

  books.push(newBook);

  saveBooks();
  displayBooks();

  bookForm.reset();

  const coverPreview = document.getElementById("cover-preview");
  const coverPreviewContainer = document.getElementById(
    "cover-preview-container"
  );

  coverPreview.removeAttribute("src");
  coverPreviewContainer.hidden = true;

  lookupMessage.textContent = "Book added to your library!";
  lookupMessage.textContent = "Book added to your library!";
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