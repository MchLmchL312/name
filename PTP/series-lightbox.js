const thumbs = document.getElementById('thumbs');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImg');
let activeThumb;

function showImage(thumb) {
  activeThumb = thumb;
  const image = thumb.querySelector('img');
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
}

function showPrevious() {
  showImage(activeThumb.previousElementSibling ?? thumbs.lastElementChild);
}

function showNext() {
  showImage(activeThumb.nextElementSibling ?? thumbs.firstElementChild);
}

thumbs.addEventListener('click', (event) => {
  const thumb = event.target.closest('.thumb');
  if (thumb) {
    showImage(thumb);
    lightbox.showModal();
  }
});

document.getElementById('lightboxPrev').addEventListener('click', showPrevious);
document.getElementById('lightboxNext').addEventListener('click', showNext);
document.getElementById('lightboxClose').addEventListener('click', () => lightbox.close());

lightbox.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    showPrevious();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    showNext();
  }
});

lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox || event.target === lightboxImage) {
    lightbox.close();
  }
});
