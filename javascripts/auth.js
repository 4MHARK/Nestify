const modal = document.getElementById('authModal');
const loginbtn = document.getElementById('login');
const openBtn = document.querySelector('.btn-login');
const closeBtn = document.getElementById('closeModal');
const tabs = document.querySelectorAll('.tab');
const formcontents = document.querySelectorAll('.form-content');


openBtn.addEventListener('click', () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
})
// function closemodal(){
//     modal.classList.remove('active')
// }
// closeBtn.addEventListener('click', closemodal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});


tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => {t.classList.remove('active')})
        
        tab.classList.add('active')
        const target = tab.getAttribute('data-tab')
        formContents.forEach(f => {f.classList.remove('active')})
        document.getElementById(target).classList.add('active');
    })
});