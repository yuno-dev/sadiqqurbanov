// --- DATABASE ---
function getExams() { return JSON.parse(localStorage.getItem('exams')) || []; }
function saveExams(exams) { localStorage.setItem('exams', JSON.stringify(exams)); }
function getResults() { return JSON.parse(localStorage.getItem('examResults')) || []; }
function saveResult(result) {
    let results = getResults();
    results.push(result);
    localStorage.setItem('examResults', JSON.stringify(results));
}

// --- GLOBAL VARIABLES ---
let tempQuestions = [];
let editingExamId = null;
let editingQIndex = null; // Hazırda redaktə olunan sualın indeksi

// --- GİRİŞ ---
function checkLogin() {
    const pass = document.getElementById('adminPass').value;
    if (pass === "admin123") {
        document.getElementById('loginArea').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        loadAdminExams();
        loadResults();
    } else { alert("Şifrə yanlışdır!"); }
}

// --- ADMIN SİYAHI ---
function loadAdminExams() {
    const exams = getExams();
    const listContainer = document.getElementById('existingExamsList');
    if (exams.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #64748b;">Sınaq yoxdur.</p>';
        return;
    }
    listContainer.innerHTML = exams.map(exam => `
        <div class="manage-card">
            <div class="manage-info">
                <h4><i class="fas fa-folder"></i> ${exam.title}</h4>
                <p>${exam.questions.length} sual ${exam.videoLink ? '<i class="fab fa-youtube" style="color:red;"></i>' : ''}</p>
            </div>
            <div style="display:flex; align-items:center; gap: 15px;">
                <span class="status-badge ${exam.published ? 'status-active' : 'status-inactive'}">
                    ${exam.published ? 'Yayındadır' : 'Gizlidir'}
                </span>
                <div style="position:relative;">
                    <button class="menu-btn" onclick="toggleMenu(event, ${exam.id})"><i class="fas fa-ellipsis-v"></i></button>
                    <div id="menu-${exam.id}" class="action-menu">
                        <button onclick="toggleStatus(${exam.id})">
                            <i class="fas ${exam.published ? 'fa-eye-slash' : 'fa-eye'}"></i> ${exam.published ? 'Dayandır' : 'Yayımla'}
                        </button>
                        <button onclick="editExam(${exam.id})"><i class="fas fa-edit"></i> Düzəliş et</button>
                        <button class="delete-btn" onclick="deleteExam(${exam.id})"><i class="fas fa-trash"></i> Sil</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleMenu(event, id) {
    event.stopPropagation();
    document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show'));
    const menu = document.getElementById(`menu-${id}`);
    if (menu) menu.classList.toggle('show');
}
window.onclick = function () { document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show')); }

// --- SINAQ REDAKTƏSİ (Sınağı Yüklə) ---
function editExam(id) {
    const exams = getExams();
    const examToEdit = exams.find(e => e.id === id);
    if (examToEdit) {
        editingExamId = id;
        tempQuestions = JSON.parse(JSON.stringify(examToEdit.questions)); // Dərin kopya

        document.getElementById('examTitle').value = examToEdit.title;
        document.getElementById('examVideo').value = examToEdit.videoLink || "";

        renderTempQuestions();

        document.getElementById('formTitle').innerHTML = `<i class="fas fa-edit" style="color: var(--gold);"></i> Sınağa Düzəliş Et`;
        document.getElementById('saveExamBtn').innerHTML = "Dəyişiklikləri Yadda Saxla";
        document.getElementById('cancelEditBtn').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// --- SUAL REDAKTƏSİ (Inputlara Doldur) ---
function editSingleQuestion(index) {
    editingQIndex = index;
    const q = tempQuestions[index];

    document.getElementById('qText').value = q.text;
    document.getElementById('optA').value = q.options.A;
    document.getElementById('optB').value = q.options.B;
    document.getElementById('optC').value = q.options.C;
    document.getElementById('optD').value = q.options.D;
    document.getElementById('correctOpt').value = q.correct;

    // Düymələri dəyişdir
    document.getElementById('addBtnGroup').classList.add('hidden');
    document.getElementById('updateBtnGroup').classList.remove('hidden');

    // Inputa fokuslan
    document.getElementById('qText').focus();
}

// --- SUALI YENİLƏMƏK (Save Single Question Edit) ---
function updateSingleQuestion() {
    if (editingQIndex === null) return;

    const qText = document.getElementById('qText').value;
    const opts = {
        A: document.getElementById('optA').value,
        B: document.getElementById('optB').value,
        C: document.getElementById('optC').value,
        D: document.getElementById('optD').value
    };
    const correct = document.getElementById('correctOpt').value;

    if (!qText || !opts.A) { alert("Xanaları doldurun"); return; }

    // MASSİVDƏKİ KÖHNƏ SUALI ƏVƏZLƏ (YENİSİNİ YARATMA!)
    tempQuestions[editingQIndex] = { text: qText, options: opts, correct: correct };

    cancelQuestionEdit(); // Formu təmizlə və düymələri qaytar
    renderTempQuestions(); // Siyahını yenilə
}

// --- SUAL REDAKTƏSİNİ LƏĞV ETMƏK ---
function cancelQuestionEdit() {
    editingQIndex = null;
    clearInputs();
    document.getElementById('addBtnGroup').classList.remove('hidden');
    document.getElementById('updateBtnGroup').classList.add('hidden');
}

// --- YENİ SUAL ƏLAVƏ ETMƏK ---
function addQuestion() {
    const qText = document.getElementById('qText').value;
    const opts = {
        A: document.getElementById('optA').value,
        B: document.getElementById('optB').value,
        C: document.getElementById('optC').value,
        D: document.getElementById('optD').value
    };
    const correct = document.getElementById('correctOpt').value;

    if (!qText || !opts.A) { alert("Sualı və variantları doldurun"); return; }

    tempQuestions.push({ text: qText, options: opts, correct: correct });
    clearInputs();
    renderTempQuestions();
}

function clearInputs() {
    document.getElementById('qText').value = "";
    document.getElementById('optA').value = "";
    document.getElementById('optB').value = "";
    document.getElementById('optC').value = "";
    document.getElementById('optD').value = "";
}

// --- SUAL SİYAHISINI GÖSTƏRMƏK ---
function renderTempQuestions() {
    document.getElementById('questionsContainer').innerHTML = tempQuestions.map((q, i) => `
        <div class="question-list-item">
            <div style="flex:1;">
                <strong>${i + 1}.</strong> ${q.text} <span style="color:var(--success)">(${q.correct})</span>
            </div>
            <div style="display:flex; gap:10px;">
                <button onclick="editSingleQuestion(${i})" class="btn-icon-edit"><i class="fas fa-pencil-alt"></i></button>
                <button onclick="deleteSingleQuestion(${i})" class="btn-icon-delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function deleteSingleQuestion(index) {
    if (confirm("Sualı silmək istəyirsiniz?")) {
        tempQuestions.splice(index, 1);
        renderTempQuestions();
    }
}

// --- SINAĞI BAZAYA YAZMAQ ---
function saveExamToDB() {
    const title = document.getElementById('examTitle').value;
    const videoLink = document.getElementById('examVideo').value;

    if (!title || tempQuestions.length === 0) { alert("Başlıq və sual lazımdır!"); return; }

    let exams = getExams();

    if (editingExamId) {
        const index = exams.findIndex(e => e.id === editingExamId);
        if (index > -1) {
            exams[index].title = title;
            exams[index].videoLink = videoLink;
            exams[index].questions = tempQuestions;
        }
        alert("Sınaq uğurla yeniləndi!");
    } else {
        exams.push({
            id: Date.now(),
            title: title,
            questions: tempQuestions,
            videoLink: videoLink,
            published: true
        });
        alert("Yeni sınaq yaradıldı!");
    }

    saveExams(exams);
    resetForm();
    loadAdminExams();
}

function resetForm() {
    editingExamId = null;
    tempQuestions = [];
    cancelQuestionEdit();
    document.getElementById('examTitle').value = "";
    document.getElementById('examVideo').value = "";
    document.getElementById('questionsContainer').innerHTML = "";

    document.getElementById('formTitle').innerHTML = `<i class="fas fa-plus-circle" style="color: var(--gold);"></i> Yeni Sınaq`;
    document.getElementById('saveExamBtn').innerHTML = "Sınağı Yayımla (Publish)";
    document.getElementById('cancelEditBtn').classList.add('hidden');
}

// --- DİGƏR FUNKSİYALAR ---
function toggleStatus(id) {
    let exams = getExams();
    const index = exams.findIndex(e => e.id === id);
    if (index > -1) {
        if (exams[index].published && confirm("Yayımı dayandırsanız nəticələr silinəcək. Razısınız?")) {
            let results = getResults();
            results = results.filter(r => r.examTitle !== exams[index].title);
            localStorage.setItem('examResults', JSON.stringify(results));
            exams[index].published = false;
        } else if (!exams[index].published) {
            exams[index].published = true;
        }
        saveExams(exams);
        loadAdminExams();
        loadResults();
    }
}

function deleteExam(id) {
    if (confirm("Silmək istədiyinizə əminsiniz?")) {
        let exams = getExams();
        const exam = exams.find(e => e.id === id);
        if (exam) {
            let results = getResults();
            results = results.filter(r => r.examTitle !== exam.title);
            localStorage.setItem('examResults', JSON.stringify(results));
        }
        exams = exams.filter(e => e.id !== id);
        saveExams(exams);
        loadAdminExams();
        loadResults();
    }
}

function loadResults() {
    const list = document.getElementById('resultsList');
    const allResults = getResults();
    if (allResults.length === 0) { list.innerHTML = '<li style="padding:10px; text-align:center; color:#64748b;">Nəticə yoxdur.</li>'; return; }
    list.innerHTML = allResults.slice().reverse().map(r =>
        `<li style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.1);">
            <strong>${r.student}</strong> | ${r.examTitle} <br>
            <span style="color:${r.score > 0 ? 'var(--success)' : 'var(--error)'}">${r.score} düz</span> 
        </li>`
    ).join('');
}

// --- TƏLƏBƏ SİSTEMİ ---
let currentExam = null;
let timerInterval;
let startTime;

if (window.location.pathname.includes('exam.html')) { loadAvailableExams(); }

function loadAvailableExams() {
    let exams = getExams().filter(e => e.published === true);
    const container = document.getElementById('availableExams');
    if (exams.length === 0) { container.innerHTML = "<p>Aktiv sınaq yoxdur.</p>"; return; }
    container.innerHTML = exams.map(exam =>
        `<div class="exam-item" style="cursor:pointer;" onclick="startExam(${exam.id})">
            <span><i class="fas fa-file-alt"></i> ${exam.title}</span>
            <span class="btn" style="padding:5px 15px; border-radius:20px; font-size:0.8rem;">Başla</span>
        </div>`
    ).join('');
}

function startExam(examId) {
    const name = document.getElementById('studentName').value;
    if (!name) { alert("Adınızı daxil edin!"); return; }
    const exams = getExams();
    currentExam = exams.find(e => e.id === examId);
    document.getElementById('studentLogin').classList.add('hidden');
    document.getElementById('examArea').classList.remove('hidden');
    document.getElementById('displayExamTitle').innerText = currentExam.title;
    renderQuiz();
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const min = Math.floor(elapsed / 60);
        const sec = elapsed % 60;
        document.getElementById('timer').innerHTML = `<i class="far fa-clock"></i> ${min}:${sec < 10 ? '0' + sec : sec}`;
    }, 1000);
}

function renderQuiz() {
    document.getElementById('quizForm').innerHTML = currentExam.questions.map((q, index) => `
        <div class="question-card" id="qCard-${index}">
            <div class="question-text">${index + 1}. ${q.text}</div>
            <div class="options-grid">
                ${['A', 'B', 'C', 'D'].map(opt => `
                    <label class="option-label" id="label-${index}-${opt}">
                        <input type="radio" name="q${index}" value="${opt}">
                        ${opt}) ${q.options[opt]}
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function finishExam() {
    clearInterval(timerInterval);
    const duration = Math.floor((Date.now() - startTime) / 1000);
    let correctCount = 0;
    currentExam.questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if (selected && selected.value === q.correct) correctCount++;
    });
    saveResult({ student: document.getElementById('studentName').value, examTitle: currentExam.title, score: correctCount, duration: duration });
    document.getElementById('examArea').classList.add('hidden');
    document.getElementById('resultArea').classList.remove('hidden');
    document.getElementById('scoreText').innerText = `${currentExam.questions.length} sualdan ${correctCount} düzgün cavab.`;
    document.getElementById('timeText').innerText = `Müddət: ${Math.floor(duration / 60)} dəq ${duration % 60} san.`;
    const vidArea = document.getElementById('videoLinkArea');
    if (currentExam.videoLink) {
        vidArea.innerHTML = `<a href="${currentExam.videoLink}" target="_blank" style="display:block; background:#ff0000; color:white; padding:15px; border-radius:8px; text-decoration:none; font-weight:bold;"><i class="fab fa-youtube"></i> Video İzahına Bax</a>`;
    } else { vidArea.innerHTML = ""; }
}

function reviewQuestions() {
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('examArea').classList.remove('hidden');
    document.getElementById('finishBtn').classList.add('hidden');
    document.getElementById('backToResultsBtn').classList.remove('hidden');
    document.getElementById('timer').innerHTML = "Baxış";
    currentExam.questions.forEach((q, index) => {
        const card = document.getElementById(`qCard-${index}`);
        card.classList.add('reviewed');
        const selectedInput = document.querySelector(`input[name="q${index}"]:checked`);
        const correctLabel = document.getElementById(`label-${index}-${q.correct}`);
        if (correctLabel) correctLabel.classList.add('correct-answer');
        if (selectedInput && selectedInput.value !== q.correct) {
            card.classList.add('wrong-card');
            document.getElementById(`label-${index}-${selectedInput.value}`).classList.add('wrong-answer');
        } else if (selectedInput) { card.classList.add('correct-card'); }
        else { card.classList.add('wrong-card'); }
    });
}

function showResultsAgain() {
    document.getElementById('examArea').classList.add('hidden');
    document.getElementById('resultArea').classList.remove('hidden');
}