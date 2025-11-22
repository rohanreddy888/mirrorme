export default function SignIn() {
  return (
    <div className="bg-white text-secondary text-center rounded-3xl p-6 w-full max-w-lg">
      <div className="flex flex-col justify-center items-center gap-2">
      <h1 className="text-2xl font-bold">Sign In</h1>
      <p className="text-sm">Sign in to your account to continue</p>
      </div>
      <form className="mt-4">
        <div className="flex flex-col justify-start items-start gap-2">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder="vitalik@gmail.com" className="w-full p-2 rounded-lg border border-border" />
          <button className="bg-secondary text-white px-4 py-3 rounded-lg font-semibold text-base w-full">Sign In</button>
        </div>
      </form>
    </div>
  );
}