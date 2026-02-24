namespace RescapeR.Core
{
    public enum ResultGrade
    {
        S,
        A,
        B,
        C
    }

    public static class ResultGradeCalculator
    {
        public static ResultGrade Evaluate(int totalSeconds)
        {
            if (totalSeconds < 30 * 60)
            {
                return ResultGrade.S;
            }

            if (totalSeconds < 45 * 60)
            {
                return ResultGrade.A;
            }

            if (totalSeconds < 60 * 60)
            {
                return ResultGrade.B;
            }

            return ResultGrade.C;
        }

        public static string GetKoreanLabel(ResultGrade grade)
        {
            switch (grade)
            {
                case ResultGrade.S:
                    return "S (칼퇴의 신)";
                case ResultGrade.A:
                    return "A (모범 사원)";
                case ResultGrade.B:
                    return "B (성실 근무자)";
                default:
                    return "C (야근 확정)";
            }
        }
    }
}
