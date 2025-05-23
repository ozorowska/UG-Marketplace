"use client";

import { useState, useEffect, FormEvent } from "react";     
import { useRouter } from "next/navigation";                
import { useSession } from "next-auth/react";               
import Image from "next/image";                             
export default function RegisterPage() {
  // pola formularza i stan komponentu
  const [name, setName] = useState("");                    
  const [email, setEmail] = useState("");                  
  const [password, setPassword] = useState("");            
  const [error, setError] = useState("");                  
  const [termsAccepted, setTermsAccepted] = useState(false);  
  const [showModal, setShowModal] = useState(false);       

  const router = useRouter();                              
  const { data: session, status } = useSession();          

  // jeśli użytkownik jest już zalogowany, przekieruj na dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // obsługa formularza rejestracji
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!termsAccepted) {
      setError("Musisz zaakceptować regulamin, aby się zarejestrować.");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Coś poszło nie tak");
        return;
      }

      alert("Konto utworzone poprawnie! Zaloguj się.");
      router.push("/login");
    } catch (err) {
      setError("Błąd połączenia z serwerem");
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* lewa kolumna – formularz */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-[#002147] mb-2">UG Marketplace</h2>
            <h3 className="text-2xl font-bold text-gray-900">Zarejestruj się</h3>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* pola formularza */}
            <div className="rounded-md shadow-sm -space-y-px">
              <input
                id="name"
                type="text"
                required
                placeholder="Twoje imię"
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#002147] focus:border-[#002147] sm:text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                id="email"
                type="email"
                required
                placeholder="np. anna.kowalska@studms.ug.edu.pl"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#002147] focus:border-[#002147] sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                id="password"
                type="password"
                required
                placeholder="Twoje hasło"
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#002147] focus:border-[#002147] sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* checkbox z regulaminem */}
            <div className="flex items-start text-sm mt-2">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 mr-2"
              />
              <label htmlFor="terms" className="text-gray-700">
                Zapoznałem się z{" "}
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="text-[#002147] underline hover:text-[#001a3e]"
                >
                  regulaminem użytkowania UG Marketplace
                </button>
              </label>
            </div>

            {/* komunikat błędu */}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            {/* przycisk rejestracji */}
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#002147] hover:bg-[#001a3e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002147]"
            >
              Zarejestruj
            </button>
          </form>

          {/* link do logowania */}
          <div className="flex items-center justify-center text-sm">
            <a href="/login" className="font-medium text-[#002147] hover:text-[#001a3e]">
              Masz już konto? Zaloguj się
            </a>
          </div>
        </div>
      </div>

      {/* prawa kolumna – zdjęcie */}
      <div className="hidden md:flex w-1/2 relative">
        <Image
          src="/img/wzr1.jpg"
          alt="Panorama kampusu UG"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#002147] opacity-75"></div>
      </div>

      {/* modal z regulaminem */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto shadow-lg relative text-sm text-gray-700 space-y-4">
            <h2 className="text-xl font-bold text-[#002147]">Regulamin korzystania z aplikacji UG Marketplace</h2>
            
           {/* Modal z regulaminem */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto shadow-lg relative text-sm text-gray-700 space-y-4">
            <h2 className="text-xl font-bold text-[#002147]">Regulamin korzystania z aplikacji UG Marketplace</h2>

            <div className="space-y-3">
              <div>
                <p><strong>§1 Postanowienia ogólne</strong></p>
                <ul className="list-disc ml-5">
                  <li>Aplikacja UG Marketplace jest wewnętrzną platformą ogłoszeniową dla studentów Uniwersytetu Gdańskiego.</li>
                  <li>Stworzona jako projekt licencjacki na Wydziale Zarządzania UG.</li>
                  <li>Celem platformy jest ułatwienie wymiany dóbr i usług między studentami.</li>
                </ul>
              </div>

              <div>
                <p><strong>§2 Dostęp do Aplikacji</strong></p>
                <ul className="list-disc ml-5">
                  <li>Logowanie możliwe tylko z kontem studenckim UG.</li>
                  <li>Tylko aktywni studenci UG mają dostęp.</li>
                  <li>Użytkownik odpowiada za bezpieczeństwo swojego konta.</li>
                </ul>
              </div>

              <div>
                <p><strong>§3 Funkcjonalność Aplikacji</strong></p>
                <ul className="list-disc ml-5">
                  <li>Dodawanie ogłoszeń w 4 kategoriach: książki, notatki, korepetycje, inne.</li>
                  <li>Opcje odbioru: Oliwa, Sopot, online, „dogadamy się”.</li>
                  <li>Filtrowanie, wyszukiwanie, dodawanie do ulubionych, wiadomości w czasie rzeczywistym.</li>
                </ul>
              </div>

              <div>
                <p><strong>§4 Zasady dodawania ofert</strong></p>
                <ul className="list-disc ml-5">
                  <li>Treści muszą być zgodne z prawem i regulaminem UG.</li>
                  <li>Zakazane są treści obraźliwe, nielegalne lub wprowadzające w błąd.</li>
                  <li>Administrator może usuwać treści i blokować konta.</li>
                  <li>W razie naruszeń: <strong>support@marketplace.ug.edu.pl</strong></li>
                </ul>
              </div>

              <div>
                <p><strong>§5 Komunikacja</strong></p>
                <ul className="list-disc ml-5">
                  <li>Kontakt tylko w sprawie ogłoszeń.</li>
                  <li>Obowiązuje kultura i szacunek.</li>
                  <li>Spamowanie i nękanie są zabronione.</li>
                </ul>
              </div>

              <div>
                <p><strong>§6 Bezpieczeństwo i odpowiedzialność</strong></p>
                <ul className="list-disc ml-5">
                  <li>Platforma nie odpowiada za jakość ani legalność ogłoszeń.</li>
                  <li>Transakcje są bezpośrednie, bez pośrednictwa aplikacji.</li>
                  <li>Zaleca się ostrożność.</li>
                </ul>
              </div>

              <div>
                <p><strong>§7 Dane osobowe</strong></p>
                <ul className="list-disc ml-5">
                  <li>Przechowujemy tylko niezbędne dane (imię, email, ogłoszenia, wiadomości).</li>
                  <li>Dane nie są udostępniane dalej.</li>
                  <li>Użytkownik może zażądać usunięcia swojego konta.</li>
                </ul>
              </div>

              <div>
                <p><strong>§8 Postanowienia końcowe</strong></p>
                <ul className="list-disc ml-5">
                  <li>Rejestracja oznacza akceptację regulaminu.</li>
                  <li>Regulamin może być zmieniany.</li>
                  <li>Kontakt w razie pytań: <strong>support@marketplace.ug.edu.pl</strong></li>
                </ul>
              </div>
            </div>

            <button
              className="mt-4 px-4 py-2 bg-[#002147] text-white rounded hover:bg-[#001a3e]"
              onClick={() => setShowModal(false)}
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
            <button
              className="mt-4 px-4 py-2 bg-[#002147] text-white rounded hover:bg-[#001a3e]"
              onClick={() => setShowModal(false)}
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
