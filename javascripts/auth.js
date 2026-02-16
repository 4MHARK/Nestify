const modal = document.getElementById('authModal');
const loginbtn = document.getElementById('login');
const openBtn = document.querySelector('.btn-login');
const closeBtn = document.getElementById('closeModal');
const tabs = document.querySelectorAll('.tab');
const formcontents = document.querySelectorAll('.form-content');
const roleRadio = document.querySelectorAll('input[name="role"]');
const uploadSection = document.getElementById('landlord-upload');
const uploadFile = document.getElementById('id-upload');


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
        formcontents.forEach(f => {f.classList.remove('active')})
        document.getElementById(target).classList.add('active');
    })
});

roleRadio.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if(e.target.value === 'landlord'){
            uploadSection.classList.remove('hidden')
            uploadSection.classList.add('visible')
            
            uploadFile.setAttribute('required', 'true')
        }else{
              uploadSection.classList.add('hidden')
            uploadSection.classList.remove('visible')

            uploadFile.removeAttribute('required')
        }
    });
});