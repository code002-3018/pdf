var data = [];
var pdfName = "";

// Reference the preview container
const createPDF = document.getElementById("create-pdf");
const convertBtn = document.getElementById("convertBtn");
const pdfPage = document.getElementById("pdf-page");
const inputPage = document.getElementById("input-page");

// Function to handle file input and encode as Base64
async function encodeImageFileAsURL(element) {
  // Hide input page and show the preview page
  inputPage.style.display = "none";
  pdfPage.style.display = "block";

  const length = element.files.length;
  const promises = [];

  for (let i = 0; i < length; i++) {
    const file = element.files[i];
    const reader = new FileReader();

    let promise = new Promise((resolve) => {
      reader.onload = () => {
        resolve({
          list: reader.result, // Use FileReader's result
          fileName: file.name,
          time: new Date().toISOString() + i, // Unique timestamp
        });
      };
    });

    reader.readAsDataURL(file); // Read file as Base64
    promises.push(promise);
  }

  const results = await Promise.all(promises);
  data = [...data, ...results];
  pdfName = element.files[0].name.replace(/\.[^/.]+$/, ""); // Set PDF name
  convertToPDF();
  convertBtn.style.display = "inline-block"; // Show the save button
}

// Display images and update preview
function convertToPDF() {
  createPDF.innerHTML = ""; // Clear existing content

  data.forEach((item) => {
    // Create container for each image
    const fileItem = document.createElement("div");
    fileItem.setAttribute("class", "file-item");

    const imgContainer = document.createElement("div");
    imgContainer.setAttribute("class", "img-container");

    // Display the image
    const img = document.createElement("img");
    img.src = item.list;
    img.alt = item.fileName;
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    imgContainer.appendChild(img);

    const imgName = document.createElement("p");
    imgName.innerText = item.fileName;

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.setAttribute("class", "delete-btn");
    deleteBtn.setAttribute("id", item.time);
    deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';
    deleteBtn.addEventListener("click", (e) => handleDelete(e));

    fileItem.appendChild(imgContainer);
    fileItem.appendChild(imgName);
    fileItem.appendChild(deleteBtn);

    createPDF.appendChild(fileItem); // Add to preview
  });
}

// Delete image from preview
function handleDelete(e) {
  data = data.filter((item) => item.time !== e.currentTarget.id);
  if (data.length === 0) {
    location.reload(); // Reload if no files left
  } else {
    convertToPDF(); // Update preview
  }
}

// Embed images into PDF
async function embedImages() {
  const pdfDoc = await PDFLib.PDFDocument.create();

  for (const item of data) {
    const jpgImageBytes = await fetch(item.list).then((res) => res.arrayBuffer());
    const jpgImage = await pdfDoc.embedJpg(jpgImageBytes);

    const page = pdfDoc.addPage([620, 800]); // Set page size
    page.drawImage(jpgImage, {
      x: 20,
      y: 50,
      width: 580,
      height: 700,
    });
  }

  const pdfBytes = await pdfDoc.save();
  download(pdfBytes, pdfName || "document", "application/pdf");
}
