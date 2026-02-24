using UnityEngine;

namespace RescapeR.Core
{
    public static class ElevatorDialogueProvider
    {
        private static readonly string[] Lines =
        {
            "오늘 점심 메뉴가 뭐였지...",
            "이번 주말엔 진짜 쉰다.",
            "퇴근 후에 운동할 수 있을까?",
            "메일은 내일 아침에 보자.",
            "아무도 말이 없네..."
        };

        public static string GetRandomLine()
        {
            return Lines[Random.Range(0, Lines.Length)];
        }
    }
}
