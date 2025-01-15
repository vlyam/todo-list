function getCurrentDate() {
    const weekDays = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    const months = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];
    const today = new Date();
    const dayWeek = weekDays[today.getDay()];
    const day = today.getDate();
    const month = months[today.getMonth()];
    return {
        dayWeek,
        day,
        month,
    }
};

function displayCurrentDate(currentDate) {
    const weekDay = document.querySelector('.header__curent-week-day');
    const monthAndDay = document.querySelector('.header__curent-day');
    weekDay.textContent = currentDate.dayWeek;
    monthAndDay.textContent = `${currentDate.day} ${currentDate.month}`;
}

function startApp() {
    // Показываем текущую дату
    displayCurrentDate(getCurrentDate());

    // Подтягиваем элементы DOM
    const tasksList = document.getElementById('tasks'); //Список задач (ul)
    const form = document.getElementById('addTaskForm'); // Форма добавления новой задачи
    const allTasksTab = document.getElementById('allTasks'); // Вкладка "Все задачи"
    const activeTasksTab = document.getElementById('activeTasks'); // Вкладка "Активные задачи"
    const completedTasksTab = document.getElementById('completedTasks'); // Вкладка "Выполненные задачи"
    const addTaskButton = document.getElementById('addTaskButton'); // Кнопка добавления новой задачи
    const modal = document.getElementById('modal'); // Модальное окно
    const modalContainer = document.querySelector('.modal__container');
    const modalDrag = document.querySelector('.modal__drag');
    const modalButtonClose = document.querySelector('.modal__form-button--close');
    const todoListTitle = document.querySelector('.todo-list__title');
    const search = document.getElementById('searchInput'); // Поле поиска
    const searchButton = document.getElementById('searchButton') // Кнопка поиска
    const searchClear = document.getElementById('searchClear') // Кнопка очистки поиска
    const notification = document.getElementById('notification') // Контейнер сообщения


    // ОТКРЫТИЕ-ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА

    let startY = null;
    let currentY = null;
    let initialTransform = 0;
    let isDragging = false;

    // Получаем позицию события
    function getClientY(event) {
        return event.touches ? event.touches[0].clientY : event.clientY;
    };

    // Начало перетаскивания
    function startDrag(e) {
        startY = getClientY(e);
        const transformStyle = getComputedStyle(modalContainer).transform;
        if (transformStyle !== 'none') {
            initialTransform = parseInt(transformStyle.split(',')[5]) || 0;
        };
        currentY = 0;
        isDragging = true;
    };

    // Перемещение
    function onDrag(e) {
        if (!isDragging || startY === null) return;
        currentY = getClientY(e) - startY;
        if (currentY > 0) {
            modalContainer.style.transform = `translateY(${initialTransform + currentY}px)`;
        };
    };

    // Завершение перетаскивания
    function endDrag() {
        if (!isDragging) return;

        isDragging = false;
        if (currentY > 100) {
            hideModal();
        } else {
            resetModal();
        };
        startY = null;
        currentY = null;
    };

    // Клик на затемненный фон
    modal.addEventListener('click', (e) => {
        if (!modalContainer.contains(e.target)) {
            hideModal();
        };
    });

    // Нажатие на ESC
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            hideModal();
        };
    });

    // Клик на кнопку отмены
    modalButtonClose.addEventListener('click', () => {
        hideModal();
    });

    // Подключение событий тача для мобилок
    modalDrag.addEventListener('touchstart', startDrag);
    modalDrag.addEventListener('touchmove', onDrag);
    modalDrag.addEventListener('touchend', endDrag);

    // Подключение событий для мыши
    modalDrag.addEventListener('mousedown', (e) => {
        startDrag(e);
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', endDragOnce);
    });

    // Перетаскивание мышкой
    function endDragOnce(e) {
        endDrag(e);
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', endDragOnce);
    };

    // Закрытие модального окна
    function hideModal() {
        modal.classList.add('hidden');
        modalContainer.style.transform = ''; // Сброс трансформации
    };

    // Возврат модального окна в исходное положение
    function resetModal() {
        modalContainer.style.transform = 'translateY(0)';
    };

    // Открытие модального окна по кнопке
    addTaskButton.addEventListener('click', (e) => {
        modal.classList.remove('hidden');
    });



    // РАБОТА С ЗАДАЧАМИ

    // Инициализировать массив задач из localStorage
    const tasks = getTasksFromLocalStorage();
    let currentTasks = [];

    // Функция для инициализации массива задач из localStorage
    function getTasksFromLocalStorage() {
        return JSON.parse(localStorage.getItem('tasks')) || [];
    };

    // Функция для получения из localStorage активной вкладки
    function getStateFromLocalStorage() {
        return localStorage.getItem('state') || 'all';
    };

    // Функция для сохранения массива задач в localStorage
    function saveTasksToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    // Функция для сохранения в localStorage активной вкладки
    function saveStateToLocalStorage(state) {
        localStorage.setItem('state', state);
    };

    // Объект для хранения таймеров удаления
    let deleteTimeouts = {};

    // Функция для добавления новой задачи
    function addTask(description, date, reminder) {
        if (!Array.isArray(tasks)) { // Проверка, что задачи существуют
            console.error("tasks не является массивом.");
            return;
        }
        const id = Date.now();
        tasks.push(
            {
                id,
                description,
                date,
                completed: false,
                reminder,
            }
        );

        saveTasksToLocalStorage();
        renderTasks('all');
        saveStateToLocalStorage('all');
        setActiveTab(allTasksTab);
    };


    // Функция для отображения задач с учетом фильтрации
    function renderTasks(filter = 'all', search = '') {
        tasksList.innerHTML = ''; // Очищаем текущий список задач
        todoListTitle.textContent = 'Список дел';

        if (!Array.isArray(tasks)) { // Проверка, что задачи существуют
            console.error("tasks не является массивом.");
            return;
        }

        currentTasks = tasks.filter(task => {
            if (filter === 'all') {
                return true;
            }
            else if (filter === 'active') {
                return !task.completed;
            }
            else {
                return task.completed;
            }
        })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .filter(task => {
                if (search === '') {
                    return true;
                } else {
                    return task.description.toLowerCase().includes(search.toLowerCase()); // нижний регистр для нечувствительности
                }
            });

        currentTasks.forEach((task) => {
            const li = document.createElement('li'); // Создаем элемент списка задач
            li.className = 'todo-list__task';
            li.id = task.id;
            const formattedDate = getInputAndSetDate(task.date); // получаем дату и время для вывода на экран


            // ЗАПОЛНЕНИЕ ЭЛЕМЕНТА СПИСКА
            li.className = 'todo-list__task';
            // Создаем label
            const label = document.createElement('label');
            label.className = `task ${task.completed ? 'task--completed' : ''}`;
            // Создаем чек
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'task__checkbox';
            const checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkboxInput.className = 'task__checkbox-input';
            if (task.completed) checkboxInput.checked = true;
            const checkboxButton = document.createElement('div');
            checkboxButton.className = 'task__checkbox-button';
            checkboxDiv.appendChild(checkboxInput);
            checkboxDiv.appendChild(checkboxButton);
            // Создаем элементы с инфой про задачу и датой
            const infoDiv = document.createElement('div');
            infoDiv.className = 'task__information';
            const dateParagraph = document.createElement('p');
            dateParagraph.className = 'task__date';
            dateParagraph.textContent = formattedDate;
            // Создаем параграф для описания задачи
            const descriptionParagraph = document.createElement('p');
            descriptionParagraph.className = 'task__description';
            if (search) { // Если отрисовка поиска то подсвечиваем текст жирным
                const regex = new RegExp(`(${search})`, 'gi'); // Регялярное выражение: 'g' для глобального поиска, 'i' для нечувствительности к регистру
                descriptionParagraph.innerHTML = task.description.replace(regex, '<strong>$1</strong>');
            } else { // Если просто отрисовка, то просто текст
                descriptionParagraph.textContent = task.description;
            }
            infoDiv.appendChild(dateParagraph);
            infoDiv.appendChild(descriptionParagraph);
            // Добавляем кнопку удаления
            const deleteButton = document.createElement('button');
            deleteButton.className = 'task__delete-button';
            // Добавляем элементы в label
            label.appendChild(checkboxDiv);
            label.appendChild(infoDiv);
            label.appendChild(deleteButton);
            // Добавляем label в li
            li.appendChild(label);
            tasksList.appendChild(li); // добавляем задачу в список
        });
        checkTaskCount('Список пуст');
    };

    // Обрабатываем событие отправки формы для добавления новой задачи
    form.addEventListener('submit', event => {
        event.preventDefault();

        const description = event.target.elements.descriptionEntry.value;
        const date = event.target.elements.dateEntry.value;
        const switcher = event.target.elements.switchCheckbox.checked;

        // Проверяем, что поля заполнены
        if (description && date) {
            // Добавляем новую задачу
            addTask(description, date, switcher);
            form.reset();
            hideModal();
        };
    });

    // Обработка изменения состояния задачи
    tasksList.addEventListener('change', event => {
        if (event.target.matches('.task__checkbox-input')) {
            const taskId = event.target.closest('li').getAttribute('id');
            toggleTaskCompletion(taskId);
            searchReset();
            checkTaskCount('Список пуст');
        };
    });

    function deleteTask(taskId) {
        const taskItem = document.getElementById(taskId);
        const undoButton = document.createElement('button');
        const countdownSpan = document.createElement('span');

        undoButton.textContent = 'Отмена';
        undoButton.classList.add('task-delete-timer__undo-button');
        countdownSpan.classList.add('task-delete-timer__text');
        countdownSpan.textContent = ' (3 сек.)';

        // Скрываем задачу и показываем кнопку "Undo" с таймером
        const taskItemTask = taskItem.querySelector('.task');
        taskItemTask.style.visibility = 'hidden';
        const taskItemDeleteTimer = document.createElement('div');
        taskItemDeleteTimer.className = 'task-delete-timer';
        const taskItemDeleteTimerContainer = document.createElement('div');
        taskItemDeleteTimerContainer.className = 'task-delete-timer__container';
        taskItemDeleteTimerContainer.appendChild(undoButton);
        taskItemDeleteTimerContainer.appendChild(countdownSpan);
        taskItemDeleteTimer.appendChild(taskItemDeleteTimerContainer);
        taskItem.appendChild(taskItemDeleteTimer);

        let countdown = 3; // Начальное время ожидания
        const intervalId = setInterval(() => {
            countdown -= 1;
            countdownSpan.textContent = ` (${countdown} сек.)`;
        }, 1000);

        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            const taskIndex = tasks.findIndex(task => task.id === Number(taskId));
            if (taskIndex !== -1) {
                tasks.splice(taskIndex, 1);
                saveTasksToLocalStorage();
                renderTasks(loadAndSetTab());
            } else {
                console.log('Задача удалена или не найдена.');
            }
        }, 3000);



        // Сохраняем таймеры в объекте, используя taskId как ключ
        deleteTimeouts[taskId] = { timeoutId, intervalId };

        // Обработчик для кнопки "Undo"
        undoButton.addEventListener('click', () => {
            clearTimeout(deleteTimeouts[taskId].timeoutId); // Останавливаем таймер удаления
            clearInterval(deleteTimeouts[taskId].intervalId); // Останавливаем таймер обратного отсчета
            delete deleteTimeouts[taskId]; // Удаляем из объекта
            taskItemDeleteTimer.remove();
            taskItemTask.removeAttribute('style');
        });
    };

    // Кнопка удаления
    tasksList.addEventListener('click', event => {
        if (event.target.matches('.task__delete-button')) {
            const taskId = event.target.closest('li').id;
            deleteTask(taskId);
            checkTaskCount('Список пуст');
        };
    });



    // Функция для переключения статуса выполнения задачи
    function toggleTaskCompletion(taskId) {
        const taskIdNumber = Number(taskId);
        const task = tasks.find(t => t.id === taskIdNumber); // Ищем задачу по id
        if (task) {
            task.completed = !task.completed; // Переключаем статус задачи
            saveTasksToLocalStorage();
            renderTasks(loadAndSetTab()); // Перерисовываем задачи с обновленным состоянием
        } else {
            console.error(`Задача с id ${taskIdNumber} не найдена!`); // Добавим лог ошибки
        }
    };

    // Обрабатываем переключение вкладки "Все задачи"
    allTasksTab.addEventListener('click', () => {
        handlingTabTask('all', allTasksTab);
    });

    // Обрабатываем переключение вкладки "Активные задачи"
    activeTasksTab.addEventListener('click', () => {
        handlingTabTask('active', activeTasksTab);
    });

    // Обрабатываем переключение вкладки "Завершенные задачи"
    completedTasksTab.addEventListener('click', () => {
        handlingTabTask('completed', completedTasksTab);
    });

    // Функция для обработки переключения вкладок на активную
    function handlingTabTask(state, activeTab) {
        renderTasks(state);
        setActiveTab(activeTab)
        saveStateToLocalStorage(state);
        searchReset();
        checkTaskCount('Список пуст');
    };

    // Функция для выделения активной вкладки
    function setActiveTab(activeTab) {
        [allTasksTab, activeTasksTab, completedTasksTab].forEach(tab => tab.classList.remove('todo-list__tab--active'));
        activeTab.classList.add('todo-list__tab--active');
    };

    // Функция для получения из localStorage активной вкладки и выделения этой активной вкладки
    function loadAndSetTab() {
        let state = getStateFromLocalStorage();
        if (state == 'all') setActiveTab(allTasksTab);
        if (state == 'active') setActiveTab(activeTasksTab);
        if (state == 'completed') setActiveTab(completedTasksTab);
        return state;
    };

    // Функция для вывода даты и времени задачи на экран
    function getInputAndSetDate(inputDate) {
        const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
        const date = new Date(inputDate);
        const day = date.getDate(); // День місяця
        const month = months[date.getMonth()]; // Назва місяця
        const hours = String(date.getHours()).padStart(2, "0"); // Години
        const minutes = String(date.getMinutes()).padStart(2, "0"); // Хвилини
        const formattedDate = `${day} ${month}, ${hours}:${minutes}`;
        return formattedDate;
    };

    // Обрабатываем событие поиска
    search.addEventListener('input', (event) => {
        searchInit();
    });

    // Клик по лупе
    searchButton.addEventListener('click', () => {
        searchInit();
    });

    // Клик по крестику в поиске
    searchClear.addEventListener('click', () => {
        searchReset();
    });

    // Функция поиска
    function searchInit() {
        const searchInput = search.value.toLowerCase();
        const state = loadAndSetTab();
        renderTasks(state, searchInput);
        todoListTitle.textContent = 'Результаты поиска';
        searchButton.style.display = 'none';
        searchClear.style.display = '';
        checkTaskCount('Не найдено');
    }

    // Сброс поиска
    function searchReset() {
        searchButton.style.display = '';
        searchClear.style.display = 'none';
        search.value = '';
        renderTasks(loadAndSetTab());
        checkTaskCount('Список пуст');
    };


    // Проверка количества задач и отображение сообщения
    function checkTaskCount(text) {
        const taskCount = tasksList.children.length;
        if (taskCount === 0) {
            notification.textContent = text;
            notification.style.display = '';
            tasksList.style.display = 'none';
        } else {
            notification.textContent = '';
            notification.style.display = 'none';
            tasksList.style.display = '';
        };
    };


    // Функция браузерного уведомления
    function showNotification(task) {
        if (Notification.permission === 'granted') {
            new Notification("Напоминание", {
                body: task.description,
            });
        } else {
            console.log("Уведомления не разрешены пользователем.");
        };
    };

    // Функция проверки задач
    function checkReminders() {
        const now = new Date();
        tasks.forEach(task => {
            const taskDate = new Date(task.date);
            if (task.reminder && !task.completed && taskDate <= now) {
                showNotification(task);
                task.reminder = false;
            };
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    // Проверка разрешений на уведомления
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log("Уведомления разрешены.");
            } else {
                console.log("Пользователь запретил уведомления.");
            };
        });
    };

    // Проверка каждые 5 секунд
    setInterval(checkReminders, 5000);

    renderTasks(loadAndSetTab());


};


startApp();