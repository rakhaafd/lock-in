$(document).ready(function () {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        $('body').attr('data-theme', 'dark');
        $('#themeToggle').text('Toggle Light Mode');
    }

    // Theme toggle functionality
    $('#themeToggle').click(function () {
        const currentTheme = $('body').attr('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        $('body').attr('data-theme', newTheme);
        $(this).text(newTheme === 'light' ? 'Toggle Dark Mode' : 'Toggle Light Mode');
        localStorage.setItem('theme', newTheme);
    });

    // Hamburger menu toggle
    $('#hamburgerBtn').click(function () {
        $('#sidebar').toggleClass('active');
    });

    // Close sidebar when clicking a nav link on mobile
    $('.sidebar nav a').click(function (e) {
        e.preventDefault();
        $('.sidebar nav a').removeClass('active');
        $(this).addClass('active');
        const target = $(this).attr('href');
        $('html, body').animate({
            scrollTop: $(target).offset().top - 20
        }, 500);
        if ($(window).width() <= 768) {
            $('#sidebar').removeClass('active');
        }
    });

    // Typing animation for title
    const $typingText = $(".sidebar h1, .mobile-header h1");
    const text = "Lock-in.";
    let index = 0;
    let isTyping = true;

    function typeText() {
        if (isTyping) {
            if (index < text.length) {
                $typingText.text("🔒 " + text.slice(0, index + 1));
                index++;
                setTimeout(typeText, 100);
            } else {
                isTyping = false;
                setTimeout(typeText, 1000);
            }
        } else {
            if (index > 0) {
                $typingText.text("🔓 " + text.slice(0, index - 1));
                index--;
                setTimeout(typeText, 50);
            } else {
                isTyping = true;
                setTimeout(typeText, 500);
            }
        }
    }
    typeText();

    // Update datetime
    setInterval(() => {
        const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
        $("#datetime").text(now);
    }, 1000);

    let interval;
    let remaining = 0;
    let isPaused = false;
    let belajarLog = [];
    let belajarDone = false;

    function updateDocumentTitle() {
        if (remaining <= 0) {
            document.title = "✅ Waktu Belajar Selesai!";
            return;
        }
        const hrs = String(Math.floor(remaining / 3600)).padStart(2, '0');
        const mins = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
        const secs = String(remaining % 60).padStart(2, '0');
        document.title = `${hrs}:${mins}:${secs} - Lock in.`;
    }

    function updateCountdown() {
        const hrs = String(Math.floor(remaining / 3600)).padStart(2, '0');
        const mins = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
        const secs = String(remaining % 60).padStart(2, '0');
        $("#countdown").text(`${hrs}:${mins}:${secs}`);
        updateDocumentTitle();

        const total = parseInt($("#progressBar").attr("max"));
        $("#progressBar").val(total - remaining);

        if (remaining <= 0) {
            clearInterval(interval);
            const audio = new Audio("assets/audio/selesai.mp3");
            audio.loop = true;
            audio.play();

            setTimeout(() => {
                const subject = $("#subject").val() || "Tidak diketahui";
                const progressMax = parseInt($("#progressBar").attr("max"));
                const h = String(Math.floor(progressMax / 3600)).padStart(2, '0');
                const m = String(Math.floor((progressMax % 3600) / 60)).padStart(2, '0');
                const s = String(progressMax % 60).padStart(2, '0');

                belajarLog.push({
                    subject: subject,
                    duration: `${h}:${m}:${s}`
                });

                Swal.fire({
                    title: '✅ Waktu Belajar Selesai!',
                    text: 'Klik OK untuk melanjutkan.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    allowOutsideClick: false
                }).then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                    belajarDone = true;
                    checkResumeReady();
                });
            }, 500);
        }
    }

    function startTimer() {
        if (!isPaused) {
            const subject = $("#subject").val().trim();
            if (!subject) {
                Swal.fire({
                    title: 'Error',
                    text: 'Silakan Isi Mata Pelajaran Terlebih Dahulu!',
                    icon: 'error'
                });
                return;
            }

            const h = parseInt($("#hours").val()) || 0;
            const m = parseInt($("#minutes").val()) || 0;
            const s = parseInt($("#seconds").val()) || 0;
            remaining = h * 3600 + m * 60 + s;

            if (remaining <= 0) {
                Swal.fire({
                    title: 'Error',
                    text: 'Masukkan Waktu Belajar yang Valid!',
                    icon: 'error'
                });
                return;
            }

            $("#progressBar").attr("max", remaining);
        }

        isPaused = false;
        clearInterval(interval);
        interval = setInterval(() => {
            remaining--;
            updateCountdown();
        }, 1000);
        updateCountdown();
    }

    function pauseTimer() {
        isPaused = true;
        clearInterval(interval);
    }

    function resetTimer() {
        clearInterval(interval);
        isPaused = false;
        remaining = 0;
        $("#countdown").text("00:00:00");
        $("#progressBar").val(0);
        belajarDone = false;
        checkResumeReady();
        document.title = "Lock-in.";
    }

    $("#addTaskBtn").click(() => {
        const title = $("#taskTitle").val().trim();
        const deadline = $("#taskDeadline").val();
        if (!title) return;

        const $li = $("<li>");
        const $input = $("<input>").attr("type", "checkbox");
        $input.on("change", function () {
            if ($input.is(":checked")) {
                $li.addClass("completed");
                $input.prop("disabled", true);
            }
            checkResumeReady();
        });

        const text = ` ${title} (Target: ${deadline || 'tanpa deadline'})`;
        $li.append($input).append(text);
        $("#taskList").append($li);
        $("#taskTitle").val("");
        $("#taskDeadline").val("");
        checkResumeReady();
    });

    $("#distractBtn").click(() => {
        Swal.fire({
            title: 'Kenapa Terganggu?',
            input: 'text',
            inputPlaceholder: 'Masukkan alasan...',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                $("#distraksiList").append(`<li>${result.value}</li>`);
                checkResumeReady();
            }
        });
    });

    let isFull = false;
    $("#focusModeBtn").click(() => {
        if (!isFull) {
            document.documentElement.requestFullscreen();
            isFull = true;
        } else {
            document.exitFullscreen();
            isFull = false;
        }
    });

    let isMusicPlaying = false;
    $("#playMusicBtn").click(() => {
        const $player = $("#musicPlayer");
        if (!isMusicPlaying) {
            $player.html(`<iframe width="100%" height="300" src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1" frameborder="0" allow="autoplay" style="padding: 1.2em 0;"></iframe>`);
            isMusicPlaying = true;
        } else {
            $player.html("");
            isMusicPlaying = false;
        }
    });

    function checkResumeReady() {
        const allChecked = $("#taskList input[type='checkbox']").length > 0 &&
            $("#taskList input[type='checkbox']").toArray().every(c => $(c).is(":checked"));
        const $showResumeBtn = $("#showResume");

        if (belajarDone && allChecked) {
            $showResumeBtn.removeClass("btn-disabled").prop("disabled", false);
            $showResumeBtn.off("click").on("click", showDailyResume);
        } else {
            $showResumeBtn.addClass("btn-disabled").prop("disabled", true);
            $showResumeBtn.off("click");
        }
    }

    function showDailyResume() {
        const date = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" });
        $("#resumeDate").text(date);

        const $belajarList = $("#resumeBelajarList").empty();
        if (belajarLog.length === 0) {
            $belajarList.html("<li>Belum ada Sesi Belajar Hari Ini.</li>");
        } else {
            belajarLog.forEach(log => {
                $belajarList.append(`<li>Kamu Sudah Belajar Selama ${log.duration} Untuk Mata Pelajaran:<br>– ${log.subject}</li>`);
            });
        }

        const $todoItems = $("#taskList li");
        const $resumeTodoList = $("#resumeTodoList").empty();
        if ($todoItems.length === 0) {
            $resumeTodoList.html("<li>Belum ada Kegiatan Hari Ini ❌</li>");
        } else {
            $todoItems.each(function () {
                $resumeTodoList.append(`<li>${$(this).text().trim()}</li>`);
            });
        }

        const $distraksiItems = $("#distraksiList li");
        const $ulDistraksi = $("#resumeDistraksiList").empty();
        if ($distraksiItems.length === 0) {
            $ulDistraksi.html("<li>Tidak ada Distraksi 🎉</li>");
        } else {
            $distraksiItems.each(function () {
                $ulDistraksi.append(`<li>${$(this).text().trim()}</li>`);
            });
        }

        const $showResumeBtn = $("#showResume");
        $showResumeBtn.addClass("btn-disabled").prop("disabled", true);
        $showResumeBtn.off("click");
    }

    $("#startBtn").click(startTimer);
    $("#pauseBtn").click(pauseTimer);
    $("#resetBtn").click(resetTimer);

    checkResumeReady();

    // Fetch and generate quotes
    fetch('./data/quotes.json')
        .then(response => response.json())
        .then(data => {
            const quotes = data.quotes;
            $("#generateQuoteBtn").click(() => {
                const randomIndex = Math.floor(Math.random() * quotes.length);
                const quote = quotes[randomIndex];
                $("#quoteDisplay").html(`<p>"${quote.quote}"</p><p>- ${quote.author}</p>`);
            });
        })
        .catch(error => console.error('Error fetching quotes:', error));
});