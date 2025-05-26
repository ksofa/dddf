import { ClockIcon } from "lucide-react";
import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent, CardTitle } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";

// Data for tasks
const tasks = [
  {
    times: ["10:17", "12:35", "14:00"],
    descriptions: [
      "Верстка диалогового окна и страницы поиска",
      "Доработка ТЗ, указать время на проработку Back'a",
      "Дать обратную связь по функционалу сервису",
    ],
  },
  {
    times: ["14:12", "15:27", "16:41"],
    descriptions: [
      "Верстка диалогового окна и страницы поиска",
      "Доработка ТЗ, указать время на проработку Back'a",
      "Дать обратную связь по функционалу сервису",
    ],
  },
];

// Data for conferences
const conferences = {
  times: ["10:17", "12:35", "14:00"],
  descriptions: ["Обсуждение концепции", "Планирование спринта", "Стендап"],
};

// Data for applications
const applications = [
  {
    title: "DasyTroon - производство подшипников",
    time: "12 часов 17 минут",
  },
  {
    title: "Страница расчета кредитования в рамках банковского продукта",
    time: "3 часа 57 минут",
  },
  {
    title: "Корпоративный мессенджер с телефонией",
    time: "12 часов 17 минут",
  },
  {
    title: "Приложение кофейни",
    time: "20 часов 57 минут",
  },
];

// Data for team invitations
const teamRoles = [
  "Front-end",
  "Back-end",
  "UX/UI Дизайнер",
  "Графический дизайнер",
  "Аналитик",
];

// Data for events
const events = [
  {
    title: "Заказчик оставил комментарий по проекту Приложение кофейни",
    category: "Комментарии",
    time: "16:17",
  },
  {
    title: "Выполнен вывод средств",
    category: "Финансы",
    time: "16:01",
  },
  {
    title: "У вас осталось 3 дня до дедлайна",
    category: "Проекты",
    time: "15:42",
  },
  {
    title: "Проект был принят заказчиком",
    category: "Проекты",
    time: "14:33",
  },
  {
    title: "Проект вернули с правками",
    category: "Проекты",
    time: "13:56",
  },
  {
    title: "Дедлайн просрочен",
    category: "Проекты",
    time: "12:16",
  },
  {
    title: "До дедлайна осталось 2 дня",
    category: "Проекты",
    time: "12:16",
  },
];

// Data for calendar events
const calendarEvents = [
  { number: "1", description: "Наименование проекта" },
  { number: "2", description: "Наименование проекта" },
  { number: "3", description: "Наименование проекта" },
  { number: "4", description: "Наименование проекта" },
];

export const FrameByAnima = (): JSX.Element => {
  return (
    <section className="w-full px-2 sm:px-4 md:px-8 mt-4 sm:mt-6 bg-main-colorsbackground min-h-screen">
      <div className="flex flex-col w-full items-start gap-4 sm:gap-6">
        {/* Top row with user profile and daily schedule */}
        <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-5 w-full">
          {/* User profile card */}
          <Card className="bg-neutralneutral-100 rounded-2xl flex-1 border border-[#ececec]">
            <CardContent className="p-4 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 relative">
              <img
                className="w-20 h-20 sm:w-32 sm:h-32 object-cover mb-2 sm:mb-0 rounded-xl"
                alt="Profile"
                src="/image.png"
              />
              <div className="flex flex-col items-start gap-3 sm:gap-6 w-full">
                <div className="flex flex-col items-start gap-1 sm:gap-2">
                  <div className="flex items-start gap-1 sm:gap-2">
                    <Badge className="h-5 px-2 py-1 rounded-full border border-solid border-main-colorsorange bg-transparent">
                      <span className="text-main-colorsorange font-status text-xs sm:text-[length:var(--status-font-size)]">Занят</span>
                    </Badge>
                    <Badge className="h-5 px-2 py-1 rounded-full border border-solid border-neutralneutral-60 bg-transparent">
                      <span className="text-neutralneutral-60 font-status text-xs sm:text-[length:var(--status-font-size)]">Доступен с 13 до 18</span>
                    </Badge>
                  </div>
                  <h2 className="font-h1-alternative text-base sm:text-[length:var(--h1-alternative-font-size)] text-neutralneutral-10">Привет, Евгений К.</h2>
                </div>
                <div className="flex items-start gap-2 sm:gap-4">
                  <div className="flex h-8 sm:h-11 items-center gap-2 sm:gap-3 mr-2 sm:mr-4">
                    <span className="text-main-colorsaqua text-lg sm:text-[length:var(--number-1-font-size)] font-number-1">3</span>
                    <span className="w-[80px] sm:w-[98px] font-paragraph-16 text-xs sm:text-[length:var(--paragraph-16-font-size)] text-neutralneutral-10">Активные проекты</span>
                  </div>
                  <div className="flex h-8 sm:h-11 items-center gap-2 sm:gap-3">
                    <span className="text-main-colorsaqua text-lg sm:text-[length:var(--number-1-font-size)] font-number-1">4</span>
                    <span className="w-[80px] sm:w-[98px] font-paragraph-16 text-xs sm:text-[length:var(--paragraph-16-font-size)] text-neutralneutral-10">Участник команд</span>
                  </div>
                </div>
              </div>
              <div className="flex w-8 h-8 items-center justify-center gap-2.5 p-2.5 absolute top-4 sm:top-8 left-[70px] sm:left-[118px] bg-main-colorsgreen rounded-full">
                <span className="font-paragraph-16-medium text-neutralneutral-100 text-xs sm:text-sm">8.8</span>
              </div>
            </CardContent>
          </Card>
          {/* Daily schedule card */}
          <Card className="bg-neutralneutral-100 rounded-2xl flex-1 mt-2 sm:mt-0 border border-[#ececec]">
            <CardContent className="p-4 sm:p-8 flex flex-col gap-4 sm:gap-10">
              <div className="flex flex-col gap-2 sm:gap-3 w-full">
                <h2 className="font-h2 text-base sm:text-[length:var(--h2-font-size)] text-neutralneutral-10">На сегодня:</h2>
                <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-6 w-full">
                  {/* Tasks section */}
                  <div className="flex flex-col items-start justify-center gap-1 sm:gap-2 flex-1">
                    <h3 className="font-paragraph-16-medium text-xs sm:text-[length:var(--paragraph-16-medium-font-size)] text-neutralneutral-10">Задачи:</h3>
                    <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-6 w-full">
                      {tasks.map((taskGroup, groupIndex) => (
                        <div key={groupIndex} className="flex flex-col h-auto sm:h-[68px] items-start justify-between flex-1">
                          {taskGroup.times.map((time, index) => (
                            <div key={index} className="flex items-center gap-2 sm:gap-3 w-full">
                              <span className="w-8 sm:w-10 font-status text-xs sm:text-[length:var(--status-font-size)] text-neutralneutral-60">{time}</span>
                              <div className="flex-1 text-neutralneutral-10 text-xs sm:text-[length:var(--paragraph-16-font-size)] font-paragraph-16">{taskGroup.descriptions[index]}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator orientation="vertical" className="hidden sm:block h-[95px] bg-neutralneutral-85" />
                  {/* Conferences section */}
                  <div className="flex flex-col items-start justify-center gap-1 sm:gap-2 mt-2 sm:mt-0">
                    <h3 className="font-paragraph-16-medium text-xs sm:text-[length:var(--paragraph-16-medium-font-size)] text-neutralneutral-10">Конференции:</h3>
                    <div className="flex flex-col gap-2 sm:gap-12">
                      <div className="flex flex-col h-auto sm:h-[68px] items-start justify-between">
                        {conferences.times.map((time, index) => (
                          <div key={index} className="flex items-center gap-2 sm:gap-3">
                            <span className="w-8 sm:w-10 font-status text-xs sm:text-[length:var(--status-font-size)] text-neutralneutral-60">{time}</span>
                            <div className="text-neutralneutral-10 text-xs sm:text-[length:var(--paragraph-16-font-size)] font-paragraph-16 whitespace-nowrap">{conferences.descriptions[index]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Main content section */}
        <div className="flex flex-col items-start gap-4 sm:gap-8 px-2 sm:px-8 py-4 sm:py-10 w-full bg-neutralneutral-100 rounded-[16px_16px_0px_0px] border border-[#ececec]">
          <h1 className="font-h1-alternative text-lg sm:text-[length:var(--h1-alternative-font-size)] text-neutralneutral-10">Самое важное</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {/* Left column with applications and team invitations */}
            <div className="flex flex-col items-start justify-center gap-4 flex-1">
              {/* Applications card */}
              <Card className="w-full bg-neutralneutral-100 rounded-xl border border-solid border-[#ececec]">
                <CardContent className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 w-full">
                    <div className="flex items-center gap-2 flex-1">
                      <CardTitle className="font-h2 text-base sm:text-[length:var(--h2-font-size)]">Заявки на расчет</CardTitle>
                      <Badge className="w-8 h-6 flex items-center justify-center bg-neutralneutral-90 rounded-full">
                        <span className="text-neutralneutral-10 text-xs sm:text-[length:var(--paragraph-16-medium-font-size)]">7</span>
                      </Badge>
                    </div>
                    <button className="text-main-colorsaqua text-xs sm:text-[length:var(--paragraph-16-font-size)]">Смотреть все</button>
                  </div>
                  <div className="flex flex-col gap-2 sm:gap-4 w-full">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
                      {applications.slice(0, 2).map((app, index) => (
                        <Card key={index} className="flex-1 flex items-center gap-2.5 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border border-solid border-[#ececec]">
                          <CardContent className="p-0 flex flex-col items-start gap-1 sm:gap-2 w-full">
                            <div className="flex items-start gap-2 w-full">
                              <div className="flex-1 h-8 sm:h-10 font-paragraph-16 text-xs sm:text-[length:var(--paragraph-16-font-size)] text-neutralneutral-10 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{app.title}</div>
                              <div className="flex flex-col items-end"><img className="w-5 sm:w-6 h-5 sm:h-6" alt="Frame" src="/frame-5.svg" /></div>
                            </div>
                            <div className="flex items-center justify-center gap-1"><ClockIcon className="w-4 h-4 text-neutralneutral-60" /><span className="font-paragraph-14-medium text-xs sm:text-[length:var(--paragraph-14-medium-font-size)] text-neutralneutral-60">{app.time}</span></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
                      {applications.slice(2, 4).map((app, index) => (
                        <Card key={index} className="flex-1 flex items-center gap-2.5 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border border-solid border-[#ececec]">
                          <CardContent className="p-0 flex flex-col items-start gap-1 sm:gap-2 w-full">
                            <div className="flex items-start gap-2 w-full">
                              <div className="flex-1 h-8 sm:h-10 font-paragraph-16 text-xs sm:text-[length:var(--paragraph-16-font-size)] text-neutralneutral-10 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{app.title}</div>
                              <div className="flex flex-col items-end"><img className="w-5 sm:w-6 h-5 sm:h-6" alt="Frame" src="/frame-5.svg" /></div>
                            </div>
                            <div className="flex items-center justify-center gap-1"><ClockIcon className="w-4 h-4 text-neutralneutral-60" /><span className="font-paragraph-14-medium text-xs sm:text-[length:var(--paragraph-14-medium-font-size)] text-neutralneutral-60">{app.time}</span></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Team invitations card */}
              <Card className="w-full bg-neutralneutral-100 rounded-xl border border-solid border-[#ececec]">
                <CardContent className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 w-full">
                    <div className="flex items-center gap-2 flex-1">
                      <CardTitle className="font-h2 text-base sm:text-[length:var(--h2-font-size)]">Приглашения в команду</CardTitle>
                      <Badge className="w-8 h-6 flex items-center justify-center bg-neutralneutral-90 rounded-full"><span className="text-neutralneutral-10 text-xs sm:text-[length:var(--paragraph-16-medium-font-size)]">4</span></Badge>
                    </div>
                    <button className="text-main-colorsaqua text-xs sm:text-[length:var(--paragraph-16-font-size)]">Смотреть все</button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
                    {[0, 1].map((index) => (
                      <Card key={index} className="flex-1 flex items-start gap-2.5 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border border-solid border-[#ececec]">
                        <CardContent className="p-0 flex flex-col items-start gap-4 sm:gap-8 w-full">
                          <div className="flex flex-col gap-2 sm:gap-3 w-full">
                            <div className="flex items-start gap-2 sm:gap-3 w-full"><span className="flex-1 font-paragraph-16 text-xs sm:text-[length:var(--paragraph-16-font-size)] text-neutralneutral-60">Состав:</span></div>
                            <div className="flex flex-col items-start gap-1 sm:gap-2 w-full"><div className="flex flex-wrap items-start gap-1 sm:gap-[4px_4px] w-full">{teamRoles.map((role, roleIndex) => (<Badge key={roleIndex} className="px-1 py-0.5 bg-neutralneutral-90 rounded"><span className="font-paragraph-14 text-xs sm:text-[length:var(--paragraph-14-font-size)] text-neutralneutral-10">{role}</span></Badge>))}</div></div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2 sm:gap-0">
                            <div className="flex items-center gap-1"><span className="font-paragraph-16 text-xs sm:text-[length:var(--paragraph-16-font-size)] text-neutralneutral-60">РП:</span><div className="flex items-center"><span className="font-paragraph-16 text-xs sm:text-[length:var(--paragraph-16-font-size)] text-neutralneutral-10">Елена В.</span><img className="w-4 sm:w-5 h-4 sm:h-5" alt="Chevron" src="/chevron.svg" /></div></div>
                            <div className="flex items-center justify-center gap-1"><ClockIcon className="w-4 h-4 text-neutralneutral-60" /><span className="font-paragraph-14-medium text-xs sm:text-[length:var(--paragraph-14-medium-font-size)] text-neutralneutral-60">{index === 0 ? "3 часа 27 минут" : "23 часа 59 минут"}</span></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Events card */}
            <Card className="flex-1 h-auto sm:h-[556px] bg-neutralneutral-100 rounded-xl border border-solid border-[#ececec] overflow-hidden mt-4 sm:mt-0">
              <CardContent className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-6 px-1 sm:px-2 w-full">
                  <div className="flex items-center gap-2 flex-1"><CardTitle className="font-h2 text-base sm:text-[length:var(--h2-font-size)]">События</CardTitle><Badge className="w-8 h-6 flex items-center justify-center bg-neutralneutral-90 rounded-full"><span className="text-neutralneutral-10 text-xs sm:text-[length:var(--paragraph-16-medium-font-size)]">12</span></Badge></div>
                  <div className="h-7 pl-2 sm:pl-3 pr-2 py-0 rounded-full border border-solid border-[#dededf] flex items-center"><span className="font-paragraph-14 text-xs sm:text-[length:var(--paragraph-14-font-size)] text-neutralneutral-20">Сегодня</span><img className="w-5 sm:w-6 h-5 sm:h-6" alt="Frame" src="/frame-1.svg" /></div>
                </div>
                <div className="flex flex-col items-start gap-1 sm:gap-2 w-full mb-[-16px] sm:mb-[-24px]">
                  {events.map((event, index) => (<React.Fragment key={index}><div className="flex flex-col items-start p-1 sm:p-2 w-full rounded-lg gap-1"><h3 className="font-paragraph-16-medium text-xs sm:text-[length:var(--paragraph-16-medium-font-size)] text-neutralneutral-10">{event.title}</h3><div className="flex items-start gap-2 sm:gap-4"><span className="font-status text-xs sm:text-[length:var(--status-font-size)] text-neutralneutral-60">{event.category}</span><span className="font-paragraph-14-medium text-xs sm:text-[length:var(--paragraph-14-medium-font-size)] text-neutralneutral-60">{event.time}</span></div></div>{index < events.length - 1 && (<Separator className="w-full" />)}</React.Fragment>))}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Calendar events card */}
          <Card className="w-full bg-neutralneutral-100 rounded-xl border border-solid border-[#ececec]">
            <CardContent className="p-4 sm:p-8 flex flex-col items-start gap-4 sm:gap-6">
              <CardTitle className="font-h2 text-base sm:text-[length:var(--h2-font-size)]">Календарь событий</CardTitle>
              <div className="flex flex-col gap-2 sm:gap-4 w-full">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
                  {calendarEvents.slice(0, 2).map((event, index) => (
                    <Card key={index} className="flex-1 flex gap-2.5 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border border-solid border-[#dededf]">
                      <CardContent className="p-0 flex flex-col items-start gap-1 w-full">
                        <h3 className="w-full font-paragraph-16-medium text-xs sm:text-[length:var(--paragraph-16-medium-font-size)] text-neutralneutral-10">Заявка №{event.number}</h3>
                        <p className="w-full font-paragraph-16 text-xs sm:text-[length:var(--paragraph-16-font-size)] text-neutralneutral-40">{event.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
                  {calendarEvents.slice(2, 4).map((event, index) => (
                    <Card key={index} className="flex-1 flex gap-2.5 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border border-solid border-[#dededf]">
                      <CardContent className="p-0 flex flex-col items-start gap-1 w-full">
                        <h3 className="w-full font-paragraph-16-medium text-xs sm:text-[length:var(--paragraph-16-medium-font-size)] text-neutralneutral-10">Заявка №{event.number}</h3>
                        <p className="w-full font-paragraph-16 text-xs sm:text-[length:var(--paragraph-16-font-size)] text-neutralneutral-40">{event.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
