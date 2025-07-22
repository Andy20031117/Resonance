document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector('.carousel-track');
  const episodes = document.querySelectorAll('.episode');
  const leftArrow = document.querySelector('.arrow.left');
  const rightArrow = document.querySelector('.arrow.right');

  let episodeList = Array.from(episodes);
  let currentIndex = 3; // EP01 在中間

  function updateCarousel() {
    // 清除所有 active
    episodeList.forEach((ep, i) => {
      ep.classList.remove('active');
    });

    // 設定中間那個為 active
    episodeList[3].classList.add('active');

    // 計算偏移量
    const itemWidth = episodeList[0].offsetWidth + 20;
    const offset = itemWidth * (currentIndex - 3);
    track.style.transform = `translateX(-${offset}px)`;
  }

  function rotate(direction) {
    if (direction === 'left') {
      const last = episodeList.pop();
      episodeList.unshift(last);
      currentIndex = 3;
    } else {
      const first = episodeList.shift();
      episodeList.push(first);
      currentIndex = 3;
    }

    // 重建 DOM
    track.innerHTML = '';
    episodeList.forEach(ep => track.appendChild(ep));
    updateCarousel();
  }

  leftArrow.addEventListener('click', () => rotate('left'));
  rightArrow.addEventListener('click', () => rotate('right'));

  window.addEventListener('load', updateCarousel);
});
