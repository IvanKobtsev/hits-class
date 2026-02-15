using System;

namespace Team13.Logging;

internal class Disposable : IDisposable
{
    private readonly Action _action;

    public Disposable(Action action)
    {
        _action = action;
    }

    public void Dispose()
    {
        _action();
    }
}
